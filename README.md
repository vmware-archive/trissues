# Service to link Pivotal Tracker to Github Issues

## Create a Github API key for TRIssues:
```sh
$ curl -i -u username -d '{"scopes":["repo"]}' https://api.github.com/authorizations
```

## Deploy to run.pivotal.io
Of course, it will also run fine on any Node server where Github and Pivotal Tracker webhooks can POST.
```sh
$ cf login -a api.run.pivotal.io
$ cf push trissues --no-start #Doesn't restart cleanly.
```

## Setting up your Tracker integration
Go to https://www.pivotaltracker.com/projects/{project id}/integrations
Scroll to \#External Tool Integrations
Select 'Other' from the Create New Integration dropdown
Enter a name, and basic auth credentials if your server is secured
For Base URL, enter https://github.com/pivotaltracker/{repo name}/issues/
For Import API URL, enter {your TRIssues server url}/githubissues
Click save, mouse over the new 'Edit' link, and copy your Integration ID from the URL - you'll need this soon.

## Setting up your Tracker Webhook
Go to https://www.pivotaltracker.com/projects/{project id}/integrations
Scroll to \#Activity Web Hook
Enter {your TRIssues server url}/fromtracker
Make sure v5 is selected and click ADD

## Setting up your Github webhook
Go to https://github.com/{owner}/{repo}/settings/hooks
Click Add Webhook
For Payload URL enter {your TRIssues server url}/fromgithub
Choose "Let me select individual events"
Select "Issues" and "Issue Comment"
Click Add Webhook

## Set environment variables
```sh
TRISSUES_AUTH_GITHUB={Github API key}
TRISSUES_AUTH_TRACKER={Tracker API key}
TRISSUES_GITHUB_REPO={repo name}
TRISSUES_TRACKER_PROJECTID={Tracker project id}
TRISSUES_TRACKER_INTEGRATIONID={Tracker integration id (see below)}
```

Optional:
```sh
TRISSUES_EXCLUDE_LABELS={comma_separated, github,labels_to_exclude}
TRISSUES_SERVER_PORT={port on which to receive webhooks}
```

## Start the server
If hosting on run.pivotal.io, use `$ cf start trissues`
Else, `npm start`
