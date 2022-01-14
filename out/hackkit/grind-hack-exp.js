/** @param {NS} ns **/
/** @param {import("../../.").NS} ns */

export async function main(ns) {
  ns.disableLog("ALL");
  async function loadBalanceWeaken(runners, target) {
    var scriptRam = 1.75;
    for (var n = 0; n < runners.length; n++) {
      ns.print("assessing target : " + runners[n]);
      var availableRam =
        ns.getServerMaxRam(runners[n]) - ns.getServerUsedRam(runners[n]);

      if (availableRam < scriptRam) {
        ns.print(runners[n] + " does not have enough RAM");
      } else {
        var threadsAvail = Math.floor((availableRam / scriptRam) * 0.5);
        if (threadsAvail != 0) {
          ns.print(
            "Going to run " + threadsAvail + " on the runner " + runners[n]
          );
          var result = ns.exec(
            "/hackkit/weaken.js",
            runners[n],
            threadsAvail,
            target
          );

          if (result) {
            ns.print("Success");
          } else {
            ns.print(
              "Error : " +
                runners[n] +
                " failed to run " +
                threadsAvail +
                " threads of /hackkit/weaken.js targetting " +
                target +
                " for some reason"
            );
          }
        }
      }
      await ns.sleep(25);
    }
  }

  var target = ns.args[0];
  var knownHosts = ns.read("/hackkit/known_hosts.txt").split(",");
  ns.print("Target = " + target);
  ns.print("knownHosts = " + knownHosts);
  ns.print("starting exp grind");
  await loadBalanceWeaken(knownHosts, target);
  await ns.sleep(ns.getWeakenTime(target));
}
