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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE');
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
  if (!data.ok) {
    res.status(404).json({ message: `Query to pexels.com failed: ${data.status} ${data.statusText}` });
    return;
  }
  const rawPictures=await data.json();
  const pictures=rawPictures.photos.map((picture) => ({
    id: picture.id,
    url: picture.src['medium'],
    alt: picture.alt,
    photographer: picture.photographer,
  }));
  res.json({ pictures });
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

app.delete('/lists/:id/pictures', async (req, res) => {
  const existingLists = await getStoredLists();
  const list = existingLists.find((list) => list.id === req.params.id);
  if (!list) {
    res.status(404).json({ message: 'List not found.' });
    return;
  }
  const pictureData = req.body;
  const toDelete = {
    ...pictureData,
  };
  const updatedLists = existingLists.map((list) => {
    if (list.id === req.params.id) {
      return {
        ...list,
        pictures: list.pictures.filter((picture) => picture.id !== toDelete.id),
      };
    }
    return list;
  });
  await storeLists(updatedLists);
  res.status(201).json({ message: 'Deleted picture.', picture: toDelete });
});

app.listen(8080);
