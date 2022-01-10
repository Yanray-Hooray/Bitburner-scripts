/** @param {import("../../.").NS} ns */
/** @param {NS} ns **/

export async function main(ns) {
	async function workAssessment(target, threadsAvail) {
		var test1 = ns.getServerMaxMoney(target)
		var test2 = ns.getGrowTime(target)
		var test3 = ns.getHackTime(target)
		if ((test1 != 0) && (test2 != Infinity) && (test3 != Infinity)) {
			var nthreads2w = Math.ceil(((ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target)) / .05))
			
			//The second variable here equals the amount of threads necessary to grow the money to it's maximum.
			var TSMoneyratio = (ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target));
			if (TSMoneyratio == Infinity) {
				ns.print(target + ' out of money, running a grow and will wait ' + ns.getGrowTime(target))
				await ns.grow(target);
				var TSMoneyratio = (ns.getServerMaxMoney(target) / ns.getServerMoneyAvailable(target));
			}
			var nthreads2g = Math.ceil(ns.growthAnalyze(target, TSMoneyratio));
			var time2g = ns.getGrowTime(target)

			// The third variable here equals the threads required to counteract the grow.
			var nthreads2w2 = Math.ceil((ns.growthAnalyzeSecurity(nthreads2g) / .05))
			var time2w = ns.getWeakenTime(target) // Only counting the 2nd weaken for time, as we want the best target overall, not just at this moment
			var time2w2 = ns.getWeakenTime(target)
			// This last variable is the amount of threads necessary to steal 90% of the server's money.
			var hpayout = (.9 * ns.getServerMaxMoney(target))
			var nthreads2h = Math.ceil(.9 / ns.hackAnalyze(target));
			var time2h = ns.getHackTime(target)

			// Find the worst case thread consumption
			var threadsMax = [nthreads2w, nthreads2g, nthreads2w2, nthreads2h]
			ns.print('Target / Threads : ' + target + " / " + threadsMax)
			threadsMax = threadsMax.sort(function (a, b) { return b - a; })

			if (nthreads2g > threadsAvail) {
				time2g = Math.ceil(time2g + (threadsAvail / nthreads2g))
			}

			if (nthreads2w > threadsAvail) {
				time2w = Math.ceil(time2w + (threadsAvail / nthreads2w))
			}

			if (nthreads2w2 > threadsAvail) {
				time2w2 = Math.ceil(ns.getWeakenTime(target) + (threadsAvail / nthreads2w2))
			}
			if (nthreads2h > threadsAvail) {
				time2h = Math.ceil(time2h + (threadsAvail / nthreads2h))
			}

			// Low quality maths to work out efficient target
			var payoutEfficiency = Math.ceil(hpayout / (time2g + time2w + time2w2 + time2h))
			ns.print(target)
			ns.print(hpayout + " / " + time2g + " | " + time2w + " | " + time2w2 + " | " + time2h)

			return [threadsMax[0], payoutEfficiency]
		}

		else {
			return [0, 0]
		}
	}

	ns.disableLog('ALL')
	var fn = "/hackkit/known_hosts.txt";
	var files = ['/hackkit/hack.js', '/hackkit/weaken.js', '/hackkit/grow.js']

	// known mem for beefiest script in hackkit
	var threadRam = 1.75

	//define uniqueness filter for recursive scan
	function unique(item) {
		return hostnames.indexOf(item) < 0;
	}

	ns.run('purchase-servers.js')
	await ns.sleep(25)

	// ns.run('hackknet.js')
	// await ns.sleep(25)

	//populate initial hostnames array
	var hostnames = ns.scan('home', true);

	var portsAvailable = ns.fileExists("BruteSSH.exe", "home") + ns.fileExists("FTPCrack.exe", "home") + ns.fileExists("RelaySMTP.exe", "home") + ns.fileExists("HTTPWorm.exe", "home") + ns.fileExists("SQLInject.exe", "home");
	//loop through each hostname in hostnames
	for (var i = 0; i < hostnames.length; i++) {
		var hostname = hostnames[i];
		//payload
		if (ns.getServerNumPortsRequired(hostname) <= portsAvailable) {
			if (ns.hasRootAccess(hostname) === false) {
				if (ns.fileExists("BruteSSH.exe", "home")) { ns.brutessh(hostname) }
				if (ns.fileExists("FTPCrack.exe", "home")) { ns.ftpcrack(hostname) }
				if (ns.fileExists("RelaySMTP.exe", "home")) { ns.relaysmtp(hostname) }
				if (ns.fileExists("HTTPWorm.exe", "home")) { ns.httpworm(hostname) }
				if (ns.fileExists("SQLInject.exe", "home")) { ns.sqlinject(hostname) }
				ns.nuke(hostname);
				ns.toast("nuked " + hostname + ".");
			}
			if (ns.hasRootAccess(hostname)) {
				//recursive scan
				var newhostnames = ns.scan(hostname, true).filter(unique);
				var hostnames = hostnames.concat(newhostnames);
			}
		}
		await ns.sleep(10)
	}
	// find all servers that we can run scripts on and prep them
	var workableHostnames = []
	for (var i = 0; i < hostnames.length; i++) {
		if ((ns.getServerMaxRam(hostnames[i]) > 0) && (ns.hasRootAccess(hostnames[i]))) {
			ns.print('Added server to workable list = ' + hostnames[i])
			await ns.scp(files, 'home', hostnames[i])
			workableHostnames.push(hostnames[i])
		}
		await ns.sleep(10)
	}

	// move the hackkit to the workable servers
	await ns.write(fn, workableHostnames, "w")
	// figure out what the max number of threads we can run is
	var totalRam = 0
	for (var i = 0; i < workableHostnames.length; i++) {
		ns.print('Total Ram / New Ram / Server adding Ram : ' + totalRam + " / " + ns.getServerMaxRam(workableHostnames[i]) + " / " + workableHostnames[i])
		totalRam = totalRam + ns.getServerMaxRam(workableHostnames[i])
	}
	var totalAvailableThreads = Math.ceil((totalRam / threadRam) - 100) // reserve for home


	// assessing and finding targets, picking the most efficient targets via payout and workability
	var payoutDict = {}
	var payoutSorted = []
	for (var i = 0; i < workableHostnames.length; i++) {
		var work = await workAssessment(workableHostnames[i], totalAvailableThreads)
		if ((work[1] != 0) && (work[1] != Infinity) && (work[0] != 0) && (work[0] != Infinity)) {
			payoutDict[work[1]] = {
				'hostname': workableHostnames[i],
				'threads': work[0]
			}
			payoutSorted.push(work[1])
		}
	}

	payoutSorted = payoutSorted.sort(function (a, b) { return b - a; })

	ns.print('all hostnames = ' + hostnames)
	ns.print('all workers = ' + workableHostnames)
	ns.print('Total Available Threads = ' + totalAvailableThreads)
	ns.print('Payout Efficiency Sorted = ' + payoutSorted)

	// start jobs based on payout, and if we have enough threads
	for (var i = 0; i < payoutSorted.length; i++) {
		var target = payoutDict[payoutSorted[i]]['hostname']
		var threads = payoutDict[payoutSorted[i]]['threads']

		ns.print('Total threads / this jobs threads ' + totalAvailableThreads + '/' + threads)
		// ns.print('assessing if we have enough threads to work on = ' + target)

		if (totalAvailableThreads > threads) {
			var totalAvailableThreads = totalAvailableThreads - threads
			ns.print('found that ' + target + ' is a good target, left over threads = ' + totalAvailableThreads)
			ns.run('/hackkit/runner.js', 1, target)
			await ns.sleep(25)
		}
	}
	ns.print('waiting for runners to finish')
	while (ns.scriptRunning('/hackkit/runner.js', 'home')) {
		await ns.sleep(60000)
	}
	// Restart this script, spawning so we catch any changes
	ns.spawn('/hackkit/startup.js', 1)
}