var FORK_W = 5;
var STAR_W = 5;
var WATCH_W = 5;

function handleXHRErrors(xhr) {
  if (xhr.status === 200) {
    return
  } else if (xhr.status === 401) {
    displayError("Error 401 (Unauthorized): Check that your API Token is valid");
  } else if (xhr.status === 403) {
    displayError("Error 403 (Forbidden): This usually means you have exceeded the query rate.  Try again later.");
  } else {
    displayError("An XMLHttpRequest error has occurred");
  }
}

//gets a list of most popular repos with same language
function get_lang(username, callback){
  var languages = [];
  var languages_u = [];
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.github.com/users/" + username + "/repos?access_token=" + APIKEY);
    xhr.addEventListener("error", function() { handleXHRErrors(xhr) });
    xhr.addEventListener("load", function () {
      handleXHRErrors(xhr);
      if (xhr.status === 200 ) {
        XHRError();
        return false;
      }
      repo_list = JSON.parse(this.response);
      repo_list.forEach(function(rl){
        languages.push(rl.language);
      });
      languages.forEach(function(e) {
          if(languages_u.indexOf(e) == -1) {
              if (e !== null){
                   languages_u.push(e);
              }
             }
         });
      repo_lang(languages_u, callback);
    });
    xhr.send();
  };

function repo_lang(languages, callback){
    results = [];
    parsed_results = [];
    final_result = [];
    var count = 1;
    languages.forEach(function(e){
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "https://api.github.com/search/repositories?q=language:" + e + "&access_token=" + APIKEY);
        xhr.addEventListener("load", function () {
        handleXHRErrors(xhr)
        search = JSON.parse(this.response);
        results.push(search);
        results.forEach(function(f){
          parsed_results.push(...f['items']);
        });
        count++;
        if (count === languages.length){
          for(var i = 0; i < 21; i++){
            var index = Math.floor(Math.random()*(parsed_results.length));
            final_result.push(parsed_results[index]);
          }
          var res = [];
          final_result.forEach(function(n) {
            if(res.indexOf(n) == -1) {
              res.push(n);
            }
          });
          callback(res);
        }
      });
      xhr.send();
    })
}

function cal_score(repo){
  fork = repo['forks_count'] * FORK_W;
  star = repo['stargazers_count'] * STAR_W;
  watch = repo['watchers_count'] * WATCH_W;
  return (fork + star + watch);
};

function get_toprepos(contrib_repos, callback){
  var best_repos = [];
  contrib_repos.forEach(function(contrib_repo){
    //gets only the repos from the list
    repos = contrib_repo['repos'];
    var contrib_topscore = 0;
    var contrib_best = {};
    repos = repos.map(function(repo) {
      repo['score'] = cal_score(repo);
      return repo;
    })
  });

  best_repos = [];
  contrib_repos.forEach(function(contrib) {
    best_repos.push(...contrib.repos);
  });
  best_repos = best_repos.sort(function(a,b) {
    if (a.score > b.score) {
      return 1;
    } else if (a.score < b.score) {
      return -1;
    } else {
      return 0;
    }
  });
  callback(best_repos.filter(function(e) { return !e.fork }));
};

function get_stars(username, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "https://api.github.com/users/" + username + "/starred?access_token=" + APIKEY);
  xhr.addEventListener("load", function () {
    handleXHRErrors(xhr);
    stars = JSON.parse(this.response);
    stars = stars.map(function(repo) {
      repo['score'] = cal_score(repo);
      return repo;
    });
    callback(stars);
  });
  xhr.send();
}

//get contributers of a given repo name
function get_contribs(reponame, callback){
  var contribs;
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "https://api.github.com/repos/" + reponame + "/contributors?access_token=" + APIKEY);
  xhr.addEventListener("error", function() { handleXHRErrors(xhr) });
  xhr.addEventListener("load", function () {
    handleXHRErrors(xhr);
    contribs = JSON.parse(this.response);
    if(contribs.length && contribs.length > 0) {
      get_repos(contribs, callback);
    }
  });
  xhr.send();
};

function get_repos(contribs, callback){
  var contrib_repos;
  var processed_count = 0;
  var repos = [];

  contribs.forEach(function(contrib){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.github.com/users/" + contrib.login + "/repos?access_token=" + APIKEY);
    xhr.addEventListener("error", function() { handleXHRErrors(xhr); });
    xhr.addEventListener("load", function () {
      handleXHRErrors(xhr);
      contrib_repos = JSON.parse(this.response);
      var obj = {};
      obj['login'] = contrib.login;
      obj['id'] = contrib.id;
      obj['repos'] = contrib_repos;
      repos.push(obj);
      processed_count++;
      if (processed_count == contribs.length) {
        // done processing, do something else
        get_toprepos(repos, callback);
      //here, call the new function that gives a score.
      }
    });
    xhr.send();
  });
};
