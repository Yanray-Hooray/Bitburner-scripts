/** @param {NS} ns **/
/** @param {import("../../.").NS} ns */
export async function main(ns) {
  var i = 0;
  // power is used to calculate how much ram to buy.
  var power = 1;

  // The price of the server is determined first by multiplying 2^power * 1375000 (25 servers * 55000 [price of 1 GB of ram])
  var serverPrice = Math.pow(2, power) * 1375000;
  var money = ns.getServerMoneyAvailable("home");

  // This while loop runs until you've reached a power that will make your servers cost
  //   more then you can afford
  while (money > serverPrice) {
    power++;
    var serverPrice = Math.pow(2, power) * 1375000;
  }

  // You have to subtract 1 from the power since the last value checked in the while loop was too large
  power--;
  // Sets the amount of ram to buy
  var GB = Math.pow(2, power);
  if (GB > ns.getPurchasedServerMaxRam()) {
    GB = ns.getPurchasedServerMaxRam();
  }

  if (GB < 64) {
    ns.print("Not enough money to be worth it");
    ns.exit;
  }

  // Sets an array of your current servers. It's empty if you don't own any
  var servers = ns.getPurchasedServers(true);
  var servCount = 0;
  if (servers.length == 0) {
    ns.purchaseServer("initServ", 2);
    var servers = ns.getPurchasedServers(true);
  }

  if (GB > ns.getServerMaxRam(servers[0])) {
    ns.tprint(
      "Upgrading server farm : " + ns.getServerMaxRam(servers[0]) + " >> " + GB
    );
    // Deletes your old servers
    while (servCount < servers.length) {
      ns.killall(servers[servCount]);
      ns.deleteServer(servers[servCount]);
      servCount++;
    }

    // Buys 25 new servers
    while (i < 25) {
      ns.purchaseServer("Serv" + GB + "gb", GB);
      i++;
    }
  } else {
    ns.print("Not enough money to upgrade");
  }
}
