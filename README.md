# Service to link Pivotal Tracker to Github Issues

## Create a Github API key for TRIssues:
```sh
$ curl -i -u username -d '{"scopes":["repo"]}' https://api.github.com/authorizations
```

## Deploy to run.pivotal.io
Of course, it will also run fine on any Node server where Github and Pivotal Tracker webhooks can POST.
```sh
$ cf login -a https://api.run.pivotal.io
$ cf push trissues --no-start #Doesn't restart cleanly.
```

## Setting up your Tracker integration
1. Go to https://www.pivotaltracker.com/projects/{project id}/integrations
2. Scroll to \#External Tool Integrations
3. Select 'Other' from the Create New Integration dropdown
4. Enter a name, and basic auth credentials if your server is secured
5. For Base URL, enter https://github.com/pivotaltracker/{repo name}/issues/
6. For Import API URL, enter {your TRIssues server url}/githubissues
7. Click save, mouse over the new 'Edit' link, and copy your Integration ID from the URL - you'll need this soon.

## Setting up your Tracker Webhook
1. Go to https://www.pivotaltracker.com/projects/{project id}/integrations
2. Scroll to \#Activity Web Hook
3. Enter {your TRIssues server url}/fromtracker
4. Make sure v5 is selected and click ADD

## Setting up your Github webhook
1. Go to https://github.com/{owner}/{repo}/settings/hooks
2. Click Add Webhook
3. For Payload URL enter {your TRIssues server url}/fromgithub
4. Choose "Let me select individual events"
5. Select "Issues" and "Issue Comment"
6. Click Add Webhook

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
* If hosting on run.pivotal.io, use `$ cf start trissues`
* Else, `npm start`
