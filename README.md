# Service to link Pivotal Tracker to Github Issues

Features:  TRIssues will:
* provide an Integration panel within Pivotal Tracker allowing you to see (selected) issues from GitHub and drag them into other Tracker panels to make matching Tracker stories.
* set labels on GitHub issues named after Tracker story states each time a story imported from GitHub changes state in Tracker
* keep labels on Tracker stories imported from GitHub in sync with the labels applied to them in GitHub

Assumptions (aka current limitations):

* TRIssues links a single "project" in Pivotal Tracker to a single GitHub repository


## Configuring Your TRIssues Server

* Set up your Tracker integration
    1. Go to https://www.pivotaltracker.com/projects/{project id}/integrations
    2. Scroll to \#External Tool Integrations
    3. Select "Other" from the Create New Integration dropdown
    4. Enter a name, and basic auth credentials if the server you'll be running TRIssues on requires it
    5. For Base URL, enter https://github.com/{repo owner}/{repo name}/issues/
    6. For Import API URL, enter {your TRIssues server scheme/host/port}/githubissues
    7. Click save, mouse over the new "Edit" link, and copy the integration ID number from the URL &mdash; you'll need this for the TRIssues config.

* Set up your Tracker webhook
    1. Go to https://www.pivotaltracker.com/projects/{project id}/integrations
    2. Scroll to \#Activity Web Hook
    3. Enter {your TRIssues server scheme/host/port}/fromtracker
    4. Make sure v5 is selected and click "ADD"

* Set up your GitHub webhook
    1. Go to https://github.com/{repo owner}/{repo name}/settings/hooks
    2. Click "Add Webhook"
    3. For Payload URL enter {your TRIssues server scheme/host/port}/fromgithub
    4. Choose "All"
    5. Click Add Webhook

* Collect configuration information
    * You already have:
        * A Tracker project
        * A corresponding GitHub repository
        * The ID number for the Tracker project (from the web page address when you're logged in to Tracker and viewing that project)
        * The owner and repository names for the mathing GitHub repo (from the web page address of that repo in GitHub)
        * The Tracker integration ID number for its connection to GitHub (from the step above where you created that integration)
    * Get/create a Tracker API token:
        1. Choose a Tracker user, youself or another Tracker profile that is a Member or Owner of your Tracker project.  Updates to your project performed by TRIssues on behalf of GitHub will be recorded in your project history as actions by the user you select.
        2. Sign in to Tracker as the selected user
        3. Go to https://www.pivotaltracker.com/profile
        4. Scroll to \#API TOKEN
        5. Get the long letters-and-numbers string next to "API token", or click "Create Token" if there isn't a token value present already
    * Get a GitHub API token
        1. Choose a GitHub user, youself or another GitHub user that has access to your repository.  Updates to your repo performed by TRIssues on behalf of Tracker will be recorded in your repository's history as actions by the user you select.
        2. Generate the access token by accessing the GitHub API with the credentials of the selected GitHub user
            ```sh
$ curl -i -u username -d '{"scopes":["repo"]}' https://api.github.com/authorizations
            ```

* Deploy TRIssues on a publicly-accessible server
    * if using run.pivotal.io:
        ```sh
$ cf login -a https://api.run.pivotal.io
$ cf push trissues --no-start #Doesn't restart cleanly.
        ```

* Set server-configuration environment variables on your server
    * Required:
        ```sh
TRISSUES_AUTH_GITHUB={Github API key}
TRISSUES_AUTH_TRACKER={Tracker API token}
TRISSUES_GITHUB_REPO={owner name/repo name}
TRISSUES_TRACKER_PROJECTID={Tracker project id}
TRISSUES_TRACKER_INTEGRATIONID={Tracker integration id}
        ```

    * Optional:
        ```sh
TRISSUES_SERVER_PORT={server port on which to receive webhooks&mdash;you'll have already included this in the Tracker and GitHub webhook configurations if needed}
TRISSUES_EXCLUDE_LABELS={comma-separated list of GitHub labels that should exclude Issues from the Tracker integration panel}
        ```

## Start the server
* If hosting on run.pivotal.io, use `$ cf start trissues`
* Else, `npm start`

