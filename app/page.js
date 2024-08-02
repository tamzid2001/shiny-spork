'use client';

import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import axios from 'axios';

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

// Initialize OpenAI API
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: "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",
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
    <main className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
          Pantry Tracker
        </h1>

        <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl p-8 shadow-2xl mb-8">
          <h2 className="text-3xl font-semibold mb-6">Pantry Items</h2>
          <form onSubmit={addPantryItem} className="flex space-x-4 mb-6">
            <input
              value={newPantryItem.name}
              onChange={(e) => setNewPantryItem({ ...newPantryItem, name: e.target.value })}
              className="flex-grow bg-transparent border border-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              placeholder="Item Name"
            />
            <input
              value={newPantryItem.quantity}
              onChange={(e) => setNewPantryItem({ ...newPantryItem, quantity: e.target.value })}
              className="w-24 bg-transparent border border-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              placeholder="Qty"
            />
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              Add
            </button>
          </form>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border border-white rounded-lg px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            placeholder="Search Items"
          />
          <ul className="space-y-4">
            {filteredPantryItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between bg-white bg-opacity-5 rounded-lg p-4">
                <span className="capitalize text-lg">{item.name}</span>
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={item.quantity}
                    onChange={(e) => updatePantryItem(item.id, e.target.value)}
                    className="w-16 bg-transparent border border-white rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => deletePantryItem(item.id)}
                    className="text-red-500 hover:text-red-600 transition duration-300"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl p-8 shadow-2xl mb-8">
          <h2 className="text-3xl font-semibold mb-6">Camera and Image Classification</h2>
          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={toggleCamera}
              className={`px-6 py-3 rounded-lg font-semibold transition duration-300 ${
                isCameraOn
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
            </button>
            {isCameraOn && (
              <button
                onClick={captureImage}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition duration-300"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Capture Image'}
              </button>
            )}
            <video
              ref={videoRef}
              className={`w-full max-w-md rounded-lg ${isCameraOn ? 'block' : 'hidden'}`}
              autoPlay
            />
            {image && (
              <img src={image} alt="Captured" className="w-full max-w-md rounded-lg mt-4" />
            )}
          </div>
        </div>

        <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl p-8 shadow-2xl">
          <h2 className="text-3xl font-semibold mb-6">Recipe Suggestions</h2>
          <button
            onClick={suggestRecipes}
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-6 py-3 rounded-lg transition duration-300 mb-6"
            disabled={isLoading}
          >
            {isLoading ? 'Generating Recipes...' : 'Suggest Recipes'}
          </button>
          {recipes.length > 0 && (
            <div>
              <h3 className="text-2xl font-semibold mb-4">Suggested Recipes:</h3>
              <ul className="list-disc pl-6 space-y-2">
                {recipes.map((recipe, index) => (
                  <li key={index} className="text-lg">{recipe}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}