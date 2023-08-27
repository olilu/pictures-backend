const express = require('express');
const bodyParser = require('body-parser');


const { getStoredLists, storeLists } = require('./data/lists');

const apikey=process.env.API_KEY;

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  // Attach CORS headers
  // Required when using a detached backend (that runs on a different domain)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/lists', async (req, res) => {
  const storedLists = await getStoredLists();
  // await new Promise((resolve, reject) => setTimeout(() => resolve(), 1500));
  res.json({ lists: storedLists });
});

app.get('/lists/:id', async (req, res) => {
  const storedLists = await getStoredLists();
  const list = storedLists.find((list) => list.id === req.params.id);
  res.json({ list });
});

app.get('/search/:query', async (req, res ) => {
  const data=await fetch(`https://api.pexels.com/v1/search?query=${req.params.query}&orientation=landscape&page=1`, 
  {
      method: "GET",
      headers: {
          Accept: "application/json",
          Authorization: apikey,
      },
  });
  const Lists=await data.json();
  res.json({ Lists });
});

app.post('/lists', async (req, res) => {
  const existingLists = await getStoredLists();
  const listData = req.body;
  const newList = {
    ...listData,
    id: Math.random().toString(),
    pictures: [],
  };
  const updatedLists = [newList, ...existingLists];
  await storeLists(updatedLists);
  res.status(201).json({ message: 'Stored new list.', list: newList });
});

app.get('/lists/:id/pictures', async (req, res) => {
  const storedLists = await getStoredLists();
  const list = storedLists.find((list) => list.id === req.params.id);
  if (!list) {
    res.status(404).json({ message: 'List not found.' });
    return;
  }
  res.json({ pictures: list.pictures });
});

app.post('/lists/:id/pictures', async (req, res) => {
  const existingLists = await getStoredLists();
  const list = existingLists.find((list) => list.id === req.params.id);
  if (!list) {
    res.status(404).json({ message: 'List not found.' });
    return;
  }
  const pictureData = req.body;
  const newPicture = {
    ...pictureData,
    id: Math.random().toString(),
  };
  const updatedLists = existingLists.map((list) => {
    if (list.id === req.params.id) {
      return {
        ...list,
        pictures: [...list.pictures, newPicture],
      };
    }
    return list;
  });
  await storeLists(updatedLists);
  res.status(201).json({ message: 'Stored new picture.', picture: newPicture });
});

app.listen(8080);
