const { Octokit } = require('@octokit/rest');

async function run() {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  const payload = require(process.env.GITHUB_EVENT_PATH);

  const columnId = payload.project_card.column_id;
  const contentUrl = payload.project_card.content_url;

  // Fetch the column name
  const column = await octokit.projects.getColumn({
    column_id: columnId,
  });

  let labelToAdd;
  let labelToRemove;

  switch (column.name) {
    case 'To do':
      labelToAdd = 'status:todo';
      labelToRemove = 'status:inprogress';
      break;
    case 'In progress':
      labelToAdd = 'status:inprogress';
      labelToRemove = 'status:todo';
      break;
    case 'Done':
      labelToAdd = 'status:done';
      labelToRemove = 'status:inprogress';
      break;
    // Add more cases for other columns
    default:
      return; // No label change needed
  }

  // Extract the issue/PR number
  const contentId = contentUrl.split('/').pop();
  const repo = payload.repository.name;
  const owner = payload.repository.owner.login;
  const contentType = contentUrl.includes('/issues/') ? 'issues' : 'pulls';

  // Add and remove labels
  if (labelToRemove) {
    await octokit[contentType].removeLabel({
        owner: owner,
        repo: repo,
        [contentType.slice(0, -1) + '_number']: contentId,
        name: labelToRemove,
    });
  }
  await octokit[contentType].addLabels({
    owner: owner,
    repo: repo,
    [contentType.slice(0, -1) + '_number']: contentId,
    labels: [labelToAdd],
  });
}

run();
