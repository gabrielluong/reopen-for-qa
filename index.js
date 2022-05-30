const github = require("@actions/github");
const core = require('@actions/core');

async function run() {
  try {
    const token = core.getInput("github-token");
    const octokit = new github.getOctokit(token);
    const payload = github.context.payload;
    const repo = payload.repository.name;
    const owner = payload.repository.owner.login;
    const issueNumber = payload.issue && payload.issue.number;

    if (issueNumber === undefined) {
      core.warning("No issue number in payload.");
      return;
    }

    const issue = await octokit.rest.issues.get({
      owner: owner,
      repo: repo,
      issue_number: issueNumber,
    });
    const reopenLabel = core.getInput("reopen-label");
    let labels = issue.data.labels.map(label => label.name);

    if (!labels.includes(reopenLabel)) {
      core.notice(`Issue #${issueNumber} does not need to be QA. No actions necessary.`)
      return;
    }

    labels = labels.filter(label => label != reopenLabel);
    labels.push(core.getInput("qa-label"));

    await octokit.rest.issues.update({
      owner: owner,
      repo: repo,
      issue_number: issueNumber,
      labels,
      state: "open",
    });

    core.notice(`Reopened issue #${issueNumber} for QA-needed.`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
