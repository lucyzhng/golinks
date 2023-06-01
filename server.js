require('dotenv').config()
const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const port = 3000;
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: "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"
})


app.use(express.static('public'));

function nextPageExists(linkHeader) {
  if (!linkHeader) {
    return false;
  }
  const links = linkHeader.split(',');
  for (const link of links) {
    const [url, rel] = link.split(';');
    if (rel.trim() == 'rel="next"') {
      return true;
    }
  }
  return false;
}


async function getUserRepositoryData(userName) {
  const perPage = 100;
  let page = 1;
  let repositoryData = [];
  while (true) {
    const response = await octokit.request('GET /users/{username}/repos', {
      username: userName,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      },
      per_page: perPage,
      page: page
    })
    repositoryData = repositoryData.concat(response.data);
    const linkHeader = response.headers.link;
    if (!nextPageExists(linkHeader)) {
      break; 
    }
    page++; 
  }
  return repositoryData;
}

function getRepositoryNames(repositoryData){
  const repositoryNames = [];
  repositoryData.forEach((item) => {
    const fullName = item.full_name;
    const index = fullName.indexOf("/")
    repositoryNames.push(fullName.substring(index+1))});
  return repositoryNames;
}

async function getRepoData(userName, repoName) {
  const response = await octokit.request('GET /repos/{owner}/{repo}', {
    owner: userName,
    repo: repoName,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
  return response.data;
}

async function getRepoLanguages(userName,repoName) {
  const response = await octokit.request('GET /repos/{owner}/{repo}/languages', {
    owner: userName,
    repo: repoName,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })
  return response.data;
}

app.get('/search/:userName', async (req, res) => {
  const userName = req.params.userName;
  const getForked = req.query.forked == 'true';
  try {
    const userRepositoryData = await getUserRepositoryData(userName);
    const repositoryNames = getRepositoryNames(userRepositoryData);
    let totalStarGazers = 0;
    let totalRepoForks = 0;
    let repoSizesSum = 0;
    let reposCt = 0;
    let languagesFrequency = {}

    for (const repoName of repositoryNames) {
      const repoData = await getRepoData(userName,repoName);
      const isFork = repoData.fork;
      console.log(isFork,getForked);
      if (isFork != getForked){
        continue 
      }
        totalStarGazers += repoData.stargazers_count;
        totalRepoForks += repoData.forks_count;
        repoSizesSum += repoData.size;
        reposCt += 1;
        let repoLanguages = await getRepoLanguages(userName,repoName);
        for (const [language, _] of Object.entries(repoLanguages)) {
          if (!(language in languagesFrequency)) {
            languagesFrequency[language] = 0;
          }
          languagesFrequency[language]++;
        
      }
    }
    const averageSize = repoSizesSum / reposCt;
    
    const languagesFrequencySortedDesc = Object.entries(languagesFrequency).sort(([,v1], [,v2]) => +v2 - +v1);
    // console.log(languagesFrequencySortedDesc)
    // console.log(reposCt, totalStarGazers, totalRepoForks, repoSizesSum/reposCt, reposCt)
    const data = {
      "Total Repositories": reposCt,
      "Total Stargazers": totalStarGazers,
      "Total Forks": totalRepoForks,
      "Average Size": averageSize,
      "Languages Used": languagesFrequencySortedDesc,
    };
    // console.log(data);
    res.json(data);
  } catch (error) {
    console.error('Error searching repositories:', error);
    throw error;
  }
});



app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


