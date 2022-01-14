/** @param {NS} ns **/
/** @param {import("../../.").NS} ns */

export async function main(ns) {
  ns.disableLog("ALL");
  async function loadBalanceExec(script, runners, target, count) {
    var scriptRam = 1.75;
    var i = 0; // threads executed
    var n = 0; // runner number in array

    while (i < count) {
      ns.print("assessing target : " + runners[n]);
      if (runners[n] == "home") {
        var availableRam =
          ns.getServerMaxRam(runners[n]) -
          ns.getServerUsedRam(runners[n]) -
          100;
      } else {
        var availableRam =
          ns.getServerMaxRam(runners[n]) - ns.getServerUsedRam(runners[n]);
      }

      if (availableRam < scriptRam) {
        n = n + 1;
        ns.print(runners[n] + " does not have enough RAM");
        if (n == runners.length) {
          ns.print(
            "resetting n as we didnt have enough ram for a job, and buying servers to future proof"
          );
          if (ns.scriptRunning("/hackkit/grind-hack-exp.js", "home")) {
            await ns.sleep(10000);
          } else {
            ns.run("/hackkit/purchase-servers.js");
          }
          var n = 0;
        }
      } else {
        var threadsAvail = Math.floor(availableRam / scriptRam);
        var workToDo = count - i;
        if (threadsAvail > workToDo) {
          var scriptsToRun = workToDo;
        } else {
          var scriptsToRun = threadsAvail;
        }
        ns.print(
          "Going to run " + scriptsToRun + " on the runner " + runners[n]
        );
        var result = ns.exec(script, runners[n], scriptsToRun, target);

        if (result) {
          ns.print("Success");
          i = i + scriptsToRun;
        } else {
          ns.tprint(
            "Error : " +
              runners[n] +
              " failed to run " +
              scriptsToRun +
              " threads of " +
              script +
              " targetting " +
              target +
              " for some reason"
          );
        }
      }
      await ns.sleep(1);
    }
  }

  var target = ns.args[0];
  var knownHosts = ns.read("/hackkit/known_hosts.txt").split(",");
  ns.print("Target = " + target);
  ns.print("knownHosts = " + knownHosts);

  //This variable equals the amount of threads necessary to weaken a server to it's minimum security level.
  var nthreads2w = Math.ceil(
    (ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target)) /
      0.05
  );
  var time2w = ns.getWeakenTime(target);

  ns.print("nthreads2w = " + nthreads2w);
  ns.print("time2w = " + time2w);
  if (nthreads2w != 0) {
    ns.print("waiting weaken");
    await loadBalanceExec("hackkit/weaken.js", knownHosts, target, nthreads2w);
    await ns.sleep(time2w);
  }

  //The second variable here equals the amount of threads necessary to grow the money to it's maximum.
  var TSMoneyratio =
    ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target);
  if (TSMoneyratio == Infinity) {
    ns.print(
      target +
        " out of money, running a grow and will wait " +
        ns.getGrowTime(target)
    );
    await ns.grow(target);
    await ns.sleep(ns.getGrowTime(target));
    var TSMoneyratio =
      ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target);
  }
  var nthreads2g = Math.ceil(ns.growthAnalyze(target, TSMoneyratio));
  var time2g = ns.getGrowTime(target);
  ns.print("TSMoneyratio = " + TSMoneyratio);
  ns.print("nthreads2g = " + nthreads2g);
  ns.print("time2g = " + time2g);
  if (nthreads2g != 0) {
    ns.print("waiting grow");
    await loadBalanceExec("hackkit/grow.js", knownHosts, target, nthreads2g);
    await ns.sleep(time2g);
  }

  // The threads to weaken after the grow
  var nthreads2w2 = Math.ceil(
    (ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target)) /
      0.05
  );
  var time2w = ns.getWeakenTime(target);
  ns.print("nthreads2w2 = " + nthreads2w2);
  ns.print("time2w = " + time2w);
  if (nthreads2w2 != 0) {
    ns.print("waiting weaken");
    await loadBalanceExec("hackkit/weaken.js", knownHosts, target, nthreads2w2);
    await ns.sleep(time2w);
  }

  //This last variable is the amount of threads necessary to steal 80% of the server's money.
  var nthreads2h = Math.ceil(0.8 / ns.hackAnalyze(target));
  var time2h = ns.getHackTime(target);
  ns.print("nthreads2h = " + nthreads2h);
  ns.print("time2h = " + time2h);
  if (nthreads2h != 0) {
    ns.print("waiting hack");
    await loadBalanceExec("hackkit/hack.js", knownHosts, target, nthreads2h);
    await ns.sleep(time2h);
  }

  //Catch and alert if maths went wrong
  if (ns.getServerMoneyAvailable(target) == 0) {
    ns.tprint(
      "error : " +
        target +
        " out of money, running a grow and will wait " +
        ns.getGrowTime(target) / 60 +
        " minutes."
    );
    await ns.grow(target);
  }
}
