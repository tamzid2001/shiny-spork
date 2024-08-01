'use client';

import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
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

export default function Home() {
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({ name: '', price: '' });
  const [total, setTotal] = useState(0);
  
  const [pantryItems, setPantryItems] = useState([]);
  const [newPantryItem, setNewPantryItem] = useState({ name: '', quantity: '' });
  const [search, setSearch] = useState('');
  const [image, setImage] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const videoRef = useRef(null);

  useEffect(() => {
    const expensesQuery = query(collection(db, 'expenses'));
    const pantryQuery = query(collection(db, 'pantryItems'));

    const unsubscribeExpenses = onSnapshot(expensesQuery, (querySnapshot) => {
      let expensesArr = [];
      querySnapshot.forEach((doc) => {
        expensesArr.push({ ...doc.data(), id: doc.id });
      });
      setExpenses(expensesArr);
      const totalPrice = expensesArr.reduce((sum, item) => sum + parseFloat(item.price), 0);
      setTotal(totalPrice);
    });

    const unsubscribePantry = onSnapshot(pantryQuery, (querySnapshot) => {
      let pantryArr = [];
      querySnapshot.forEach((doc) => {
        pantryArr.push({ ...doc.data(), id: doc.id });
      });
      setPantryItems(pantryArr);
    });

    return () => {
      unsubscribeExpenses();
      unsubscribePantry();
    };
  }, []);

  const addExpense = async (e) => {
    e.preventDefault();
    if (newExpense.name !== '' && newExpense.price !== '') {
      await addDoc(collection(db, 'expenses'), {
        name: newExpense.name.trim(),
        price: newExpense.price,
      });
      setNewExpense({ name: '', price: '' });
    }
  };

  const deleteExpense = async (id) => {
    await deleteDoc(doc(db, 'expenses', id));
  };

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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
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
    try {
      const response = await axios.post('/api/classify-image', { image: imageDataUrl });
      const classification = response.data.classification;
      setNewPantryItem({ name: classification, quantity: '1' });
    } catch (err) {
      console.error("Error classifying image:", err);
    }
  };

  const suggestRecipes = async () => {
    try {
      const response = await axios.post('/api/suggest-recipes', { ingredients: pantryItems.map(item => item.name) });
      setRecipes(response.data.recipes);
    } catch (err) {
      console.error("Error suggesting recipes:", err);
    }
  };

  const filteredPantryItems = pantryItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className='flex min-h-screen flex-col items-center justify-between sm:p-24 p-4'>
      <div className='z-10 w-full max-w-5xl items-center justify-between font-mono text-sm'>
        <h1 className='text-4xl p-4 text-center'>Expense and Pantry Tracker</h1>
        
        {/* Expense Tracker Section */}
        <div className='bg-slate-800 p-4 rounded-lg mb-8'>
          <h2 className='text-2xl mb-4'>Expense Tracker</h2>
          <form className='grid grid-cols-6 items-center text-black'>
            <input
              value={newExpense.name}
              onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
              className='col-span-3 p-3 border'
              type='text'
              placeholder='Enter Item'
            />
            <input
              value={newExpense.price}
              onChange={(e) => setNewExpense({ ...newExpense, price: e.target.value })}
              className='col-span-2 p-3 border mx-3'
              type='number'
              placeholder='Enter $'
            />
            <button
              onClick={addExpense}
              className='text-white bg-slate-950 hover:bg-slate-900 p-3 text-xl'
              type='submit'
            >
              +
            </button>
          </form>
          <ul>
            {expenses.map((item) => (
              <li key={item.id} className='my-4 w-full flex justify-between bg-slate-950'>
                <div className='p-4 w-full flex justify-between'>
                  <span className='capitalize'>{item.name}</span>
                  <span>${item.price}</span>
                </div>
                <button
                  onClick={() => deleteExpense(item.id)}
                  className='ml-8 p-4 border-l-2 border-slate-900 hover:bg-slate-900 w-16'
                >
                  X
                </button>
              </li>
            ))}
          </ul>
          {expenses.length > 0 && (
            <div className='flex justify-between p-3'>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Pantry Tracker Section */}
        <div className='bg-slate-800 p-4 rounded-lg'>
          <h2 className='text-2xl mb-4'>Pantry Tracker</h2>
          <form onSubmit={addPantryItem} className='grid grid-cols-6 items-center text-black mb-4'>
            <input
              value={newPantryItem.name}
              onChange={(e) => setNewPantryItem({ ...newPantryItem, name: e.target.value })}
              className='col-span-3 p-3 border'
              type='text'
              placeholder='Item Name'
            />
            <input
              value={newPantryItem.quantity}
              onChange={(e) => setNewPantryItem({ ...newPantryItem, quantity: e.target.value })}
              className='col-span-2 p-3 border mx-3'
              type='text'
              placeholder='Quantity'
            />
            <button
              type='submit'
              className='text-white bg-slate-950 hover:bg-slate-900 p-3 text-xl'
            >
              +
            </button>
          </form>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full p-3 border mb-4 text-black'
            type='text'
            placeholder='Search Items'
          />
          <ul>
            {filteredPantryItems.map((item) => (
              <li key={item.id} className='my-4 w-full flex justify-between bg-slate-950'>
                <div className='p-4 w-full flex justify-between'>
                  <span className='capitalize'>{item.name}</span>
                  <input
                    type='text'
                    value={item.quantity}
                    onChange={(e) => updatePantryItem(item.id, e.target.value)}
                    className='w-20 bg-transparent border-b border-white'
                  />
                </div>
                <button
                  onClick={() => deletePantryItem(item.id)}
                  className='ml-8 p-4 border-l-2 border-slate-900 hover:bg-slate-900 w-16'
                >
                  X
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Camera and Recipe Section */}
        <div className='mt-8'>
          <button onClick={startCamera} className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2'>
            Start Camera
          </button>
          <button onClick={captureImage} className='bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded'>
            Capture Image
          </button>
          <video ref={videoRef} style={{ display: 'none' }} autoPlay />
          {image && <img src={image} alt="Captured" className='mt-4 max-w-full h-auto' />}
          
          <button onClick={suggestRecipes} className='mt-4 bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded'>
            Suggest Recipes
          </button>
          {recipes.length > 0 && (
            <div className='mt-4'>
              <h3 className='text-xl font-bold'>Suggested Recipes:</h3>
              <ul className='list-disc pl-5'>
                {recipes.map((recipe, index) => (
                  <li key={index}>{recipe}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}