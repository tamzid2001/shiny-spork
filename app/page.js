import Image from "next/image";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCN8oEO-YI10wiMsKfHghXkJn1LBsEzhOw",
  authDomain: "pantry-8dcb7.firebaseapp.com",
  projectId: "pantry-8dcb7",
  storageBucket: "pantry-8dcb7.appspot.com",
  messagingSenderId: "337844153251",
  appId: "1:337844153251:web:03957fd1b2700ddf5cc816",
  measurementId: "G-4WC4EKEXVS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
'use client';
import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  getDoc,
  querySnapshot,
  query,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { initializeApp, firebase } from 'firebase/app';
import { getFirestore, query, getDocs, collection, where, orderBy, addDoc, doc, getDoc, updateDoc, setDoc, limit, onSnapshot, arrayUnion, arrayRemove, serverTimestamp, deleteDoc } from "firebase/firestore";
const db = getFirestore(app);

export default function Home() {
  const [items, setItems] = useState([
    { name: 'Coffee', price: 4.95 },
    { name: 'Movie', price: 24.95 },
    { name: 'candy', price: 7.95 },
  ]);
  const [newItem, setNewItem] = useState({ name: '', price: '' });
  const [total, setTotal] = useState(0);

  // Add item to database
  const addItem = async (e) => {
    e.preventDefault();
    if (newItem.name !== '' && newItem.price !== '') {
      setItems([...items, newItem]);
      await addDoc(collection(db, 'items'), {
        name: newItem.name.trim(),
        price: newItem.price,
      });
      setNewItem({ name: '', price: '' });
    }
  };

  // Read items from database
  useEffect(() => {
    const q = query(collection(db, 'items'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let itemsArr = [];

      querySnapshot.forEach((doc) => {
        itemsArr.push({ ...doc.data(), id: doc.id });
      });
      setItems(itemsArr);

      // Read total from itemsArr
      const calculateTotal = () => {
        const totalPrice = itemsArr.reduce(
          (sum, item) => sum + parseFloat(item.price),
          0
        );
        setTotal(totalPrice);
      };
      calculateTotal();
      return () => unsubscribe();
    });
  }, []);

  // Delete items from database
  const deleteItem = async (id) => {
    await deleteDoc(doc(db, 'items', id));
  };

  return (
    <main className='flex min-h-screen flex-col items-center justify-between sm:p-24 p-4'>
      <div className='z-10 w-full max-w-5xl items-center justify-between font-mono text-sm '>
        <h1 className='text-4xl p-4 text-center'>Expense Tracker</h1>
        <div className='bg-slate-800 p-4 rounded-lg'>
          <form className='grid grid-cols-6 items-center text-black'>
            <input
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className='col-span-3 p-3 border'
              type='text'
              placeholder='Enter Item'
            />
            <input
              value={newItem.price}
              onChange={(e) =>
                setNewItem({ ...newItem, price: e.target.value })
              }
              className='col-span-2 p-3 border mx-3'
              type='number'
              placeholder='Enter $'
            />
            <button
              onClick={addItem}
              className='text-white bg-slate-950 hover:bg-slate-900 p-3 text-xl'
              type='submit'
            >
              +
            </button>
          </form>
          <ul>
            {items.map((item, id) => (
              <li
                key={id}
                className='my-4 w-full flex justify-between bg-slate-950'
              >
                <div className='p-4 w-full flex justify-between'>
                  <span className='capitalize'>{item.name}</span>
                  <span>${item.price}</span>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className='ml-8 p-4 border-l-2 border-slate-900 hover:bg-slate-900 w-16'
                >
                  X
                </button>
              </li>
            ))}
          </ul>
          {items.length < 1 ? (
            ''
          ) : (
            <div className='flex justify-between p-3'>
              <span>Total</span>
              <span>${total}</span>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}