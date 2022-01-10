/** @param {NS} ns **/
/** @param {import("../.").NS} ns */
function gainFromLevelUpgrade(X, Y, Z) {
	return (1 * 1.6) * Math.pow(1.035, Y - 1) * ((Z + 5) / 6);
}
function gainFromRamUpgrade(X, Y, Z) {
	return (X * 1.6) * (Math.pow(1.035, (2 * Y) - 1) - Math.pow(1.035, Y - 1)) * ((Z + 5) / 6);
}
function gainFromCoreUpgrade(X, Y, Z) {
	return (X * 1.6) * Math.pow(1.035, Y - 1) * (1 / 6);
}
function log2(num) {
	return Math.log(num) / Math.log(2);
}

async function upgradeAllToMatchNode(ns, baseIndex) {
	let baseNode = ns.hacknet.getNodeStats(baseIndex);
	for (let i = 0; i < ns.hacknet.numNodes(); i++) {
		let currNode = ns.hacknet.getNodeStats(i);
		if (currNode.level < baseNode.level) {
			await waitTillCash(ns, ns.hacknet.getLevelUpgradeCost(i, baseNode.level - currNode.level));
			ns.hacknet.upgradeLevel(i, baseNode.level - currNode.level);
		}
		if (currNode.ram < baseNode.ram) {
			await waitTillCash(ns, ns.hacknet.getRamUpgradeCost(i, log2(baseNode.ram / currNode.ram)));
			ns.hacknet.upgradeRam(i, log2(baseNode.ram / currNode.ram));
		}
		if (currNode.cores < baseNode.cores) {
			await waitTillCash(ns, ns.hacknet.getCoreUpgradeCost(i, baseNode.cores - currNode.cores));
			ns.hacknet.upgradeCore(i, baseNode.cores - currNode.cores);
		}
	}
}

async function waitTillCash(ns, target) {
	if (ns.getServerMoneyAvailable("home") < target)
		ns.print(`Waiting for cash to reach ${target}`);
	while (ns.getServerMoneyAvailable("home") < target)
		await ns.sleep(5000);
}

let breakevenTime = 3600 * 1;//Time in seconds

export async function main(ns) {
	ns.disableLog("ALL");
	while (ns.hacknet.numNodes() === 0) ns.hacknet.purchaseNode();

	let weakestIndex = 0;
	let weakestNode = ns.hacknet.getNodeStats(0);
	for (let i = 1; i < ns.hacknet.numNodes(); i++) {
		if (ns.hacknet.getNodeStats(i).production < weakestNode.production) {
			weakestNode = ns.hacknet.getNodeStats(i);
			weakestIndex = i;
		}
	}
	ns.print(weakestIndex);

	let bestBEven = 0;
	let gainMul = ns.getHacknetMultipliers().production

	while (bestBEven < breakevenTime) {
		weakestNode = ns.hacknet.getNodeStats(weakestIndex);
		let X = weakestNode.level;
		let Y = weakestNode.ram;
		let Z = weakestNode.cores;
		let cost, gain;
		let choice = "X";
		bestBEven = breakevenTime;

		//Try upgrading Level
		cost = ns.hacknet.getLevelUpgradeCost(weakestIndex, 1);
		gain = gainMul * gainFromLevelUpgrade(X, Y, Z);
		//ns.print(cost/gain);
		if ((cost / gain) <= bestBEven) {
			bestBEven = cost / gain;
			choice = "L";
		}

		//Try upgrading RAM
		cost = ns.hacknet.getRamUpgradeCost(weakestIndex, 1);
		gain = gainMul * gainFromRamUpgrade(X, Y, Z);
		//ns.print(cost/gain);
		if ((cost / gain) < bestBEven) {
			bestBEven = cost / gain;
			choice = "R";
		}

		//Try upgrading Cores
		cost = ns.hacknet.getCoreUpgradeCost(weakestIndex, 1);
		gain = gainMul * gainFromCoreUpgrade(X, Y, Z);
		//ns.print(cost/gain);
		if ((cost / gain) < bestBEven) {
			bestBEven = cost / gain;
			choice = "C";
		}

		//Try buying new Node
		cost = ns.hacknet.getPurchaseNodeCost();
		gain = weakestNode.production;
		//ns.print(cost/gain);
		if ((cost / gain) < bestBEven) {
			bestBEven = cost / gain;
			choice = "N";
		}

		ns.print(choice);
		switch (choice) {
			case "X": //Do nothing
				break;
			case "L":
				await waitTillCash(ns, ns.hacknet.getLevelUpgradeCost(weakestIndex, 1));
				ns.hacknet.upgradeLevel(weakestIndex, 1);
				break;
			case "R":
				await waitTillCash(ns, ns.hacknet.getRamUpgradeCost(weakestIndex, 1));
				ns.hacknet.upgradeRam(weakestIndex, 1);
				break;
			case "C":
				await waitTillCash(ns, ns.hacknet.getCoreUpgradeCost(weakestIndex, 1));
				ns.hacknet.upgradeCore(weakestIndex, 1);
				break;
			case "N":
				await waitTillCash(ns, ns.hacknet.getPurchaseNodeCost());
				ns.hacknet.purchaseNode();
				break;
		}
		await upgradeAllToMatchNode(ns, weakestIndex);
		await ns.sleep(100);
	}
}