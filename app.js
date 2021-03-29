const package = require('package.json'), git = require('simple-git')(), remoteName = 'origin';
module.exports = {
	configGit: (username, repo, branch, running, path, delay) => { return { gitUsername: username, gitRepo: repo, gitBranch: branch, localBranchPath: path, runningProcess: running, timeout: delay }; },
	initRepo: async (gitLink) => { return await git.init().then(() => git.addRemote(remoteName, gitLink)) },
	syncGit: async (options) => {
		if (!options.gitUsername || !options.gitRepo) { return; }
		if (!options.gitBranch) { options.gitBranch = 'default'; } if (!options.localBranchPath) { options.localBranchPath = '...'; } if (!options.gitBranch) { options.runningProcess = 'npm'; }
		const { spawnSync } = require('child_process'), gitLink = 'https://github.com/' + options.gitUsername + `/${options.gitRepo}.git`, app = require(`${options.localBranchPath}/package.json`);
		await git.cwd(options.localBranchPath);
		await git.checkIsRepo().then(isRepo => !isRepo && module.exports.initRepo(gitLink)).then(() => { try { git.fetch() } catch (err) { } });
		try {
			await git.pull(remoteName, options.gitBranch, (err, update) => {
				if (err) { git.branch(options.gitBranch); }
				if (update) {
					if (update.summary.changes) {
						console.log(`${package.name}: Pulled new changes from ${gitLink}, branch '${options.gitBranch}'. Restarting ${app.name}...`);
						spawnSync(`powershell.exe`, [`${options.runningProcess} restart ${app.name}`], { windowsHide: true });
					}
				}
			});
		} catch (err) { await git.branch(options.gitBranch); }
		await git.add('./*');
		await git.commit("git-sync: Auto-commit.");
		await git.push(['-f', remoteName, `HEAD:${options.gitBranch}`], () => console.log(`${package.name}: Pushed local file changes to ${gitLink}, branch '${options.gitBranch}'.`));
	},
}