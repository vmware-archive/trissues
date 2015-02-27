Service to link Pivotal Tracker to Github Issues

$ curl -i -u username -d '{"scopes":["repo"]}' https://api.github.com/authorizations

Deploy to run.pivotal.io
$ cf login -a api.run.pivotal.io
$ cf push trissues --no-start #Doesn't restart cleanly.
