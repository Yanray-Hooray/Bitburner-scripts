/** @param {NS} ns **/
export async function main(ns) {
	var targets = ns.getPurchasedServers()
	for (var i = 0; i < targets.length; i++) {
		ns.tprint('deleting ' + targets[i])
		ns.killall(targets[i])
		ns.deleteServer(targets[i])
	}
}