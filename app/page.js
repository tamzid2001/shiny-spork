'use client';

import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Typography, Container, TextField, Button, List, ListItem, ListItemText, IconButton, Card, CardContent, Grid, Box} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import process from 'process';
console.log(process.env.OPENAI_KEY);
console.log(process.env.OPENAI_API_KEY);
const firebaseConfig = {
  apiKey: "AIzaSyCN8oEO-YI10wiMsKfHghXkJn1LBsEzhOw",
  authDomain: "pantry-8dcb7.firebaseapp.com",
  projectId: "pantry-8dcb7",
  storageBucket: "pantry-8dcb7.appspot.com",
  messagingSenderId: "337844153251",
  appId: "1:337844153251:web:03957fd1b2700ddf5cc816",
  measurementId: "G-4WC4EKEXVS"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4caf50',
    },
    secondary: {
      main: '#9c27b0',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

export default function Home() {
  const [pantryItems, setPantryItems] = useState([]);
  const [newPantryItem, setNewPantryItem] = useState({ name: '', quantity: '' });
  const [search, setSearch] = useState('');
  const [image, setImage] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const pantryQuery = query(collection(db, 'pantryItems'));

    const unsubscribePantry = onSnapshot(pantryQuery, (querySnapshot) => {
      let pantryArr = [];
      querySnapshot.forEach((doc) => {
        pantryArr.push({ ...doc.data(), id: doc.id });
      });
      setPantryItems(pantryArr);
    });

    return () => unsubscribePantry();
  }, []);

  const addPantryItem = async (e) => {
    e.preventDefault();
    if (newPantryItem.name !== '' && newPantryItem.quantity !== '') {
      await addDoc(collection(db, 'pantryItems'), newPantryItem);
      setNewPantryItem({ name: '', quantity: '' });
    }
  };

  const updatePantryItem = async (id, newQuantity) => {
    await updateDoc(doc(db, 'pantryItems', id), { quantity: newQuantity });
  };

  const deletePantryItem = async (id) => {
    await deleteDoc(doc(db, 'pantryItems', id));
  };

  const toggleCamera = async () => {
    if (isCameraOn) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    }
  };

  const captureImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    setImage(imageDataUrl);
    classifyImage(imageDataUrl);
  };

  const classifyImage = async (imageDataUrl) => {
    setIsLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "What item is in this image? Please respond with just the name of the item." },
              { type: "image_url", image_url: { url: imageDataUrl } }
            ],
          },
        ],
      });
      const classification = response.choices[0].message.content.trim();
      setNewPantryItem({ name: classification, quantity: '1' });
    } catch (err) {
      console.error("Error classifying image:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestRecipes = async () => {
    setIsLoading(true);
    try {
      const ingredients = pantryItems.map(item => item.name).join(', ');
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful cooking assistant." },
          { role: "user", content: `Suggest 3 recipes using some or all of these ingredients: ${ingredients}. Please format each recipe as a bullet point.` }
        ],
      });
      const recipeText = response.choices[0].message.content;
      const recipeList = recipeText.split('\n').filter(line => line.trim().startsWith('•'));
      setRecipes(recipeList);
    } catch (err) {
      console.error("Error suggesting recipes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPantryItems = pantryItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Pantry Tracker
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  Pantry Items
                </Typography>
                <Box component="form" onSubmit={addPantryItem} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    label="Item Name"
                    variant="outlined"
                    value={newPantryItem.name}
                    onChange={(e) => setNewPantryItem({ ...newPantryItem, name: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label="Quantity"
                    variant="outlined"
                    value={newPantryItem.quantity}
                    onChange={(e) => setNewPantryItem({ ...newPantryItem, quantity: e.target.value })}
                    sx={{ width: '100px' }}
                  />
                  <Button type="submit" variant="contained" color="primary">
                    Add
                  </Button>
                </Box>
                <TextField
                  label="Search Items"
                  variant="outlined"
                  fullWidth
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <List>
                  {filteredPantryItems.map((item) => (
                    <ListItem
                      key={item.id}
                      secondaryAction={
                        <IconButton edge="end" aria-label="delete" onClick={() => deletePantryItem(item.id)}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText primary={item.name} />
                      <TextField
                        value={item.quantity}
                        onChange={(e) => updatePantryItem(item.id, e.target.value)}
                        variant="outlined"
                        size="small"
                        sx={{ width: '80px', mr: 2 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  Camera and Image Classification
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="contained"
                    color={isCameraOn ? "secondary" : "primary"}
                    onClick={toggleCamera}
                    startIcon={<CameraAltIcon />}
                  >
                    {isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
                  </Button>
                  {isCameraOn && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={captureImage}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Capture Image'}
                    </Button>
                  )}
                  <Box sx={{ width: '100%', maxWidth: '300px', overflow: 'hidden' }}>
                    <video
                      ref={videoRef}
                      style={{ display: isCameraOn ? 'block' : 'none', width: '100%', height: 'auto' }}
                      autoPlay
                    />
                  </Box>
                  {image && (
                    <Box sx={{ width: '100%', maxWidth: '300px', overflow: 'hidden' }}>
                      <img src={image} alt="Captured" style={{ width: '100%', height: 'auto' }} />
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  Recipe Suggestions
                </Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={suggestRecipes}
                  disabled={isLoading}
                  startIcon={<RestaurantIcon />}
                  sx={{ mb: 2 }}
                >
                  {isLoading ? 'Generating Recipes...' : 'Suggest Recipes'}
                </Button>
                {recipes.length > 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Suggested Recipes:
                    </Typography>
                    <List>
                      {recipes.map((recipe, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={recipe} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}