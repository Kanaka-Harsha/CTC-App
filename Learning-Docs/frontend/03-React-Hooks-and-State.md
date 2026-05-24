# 🪝 Learning: React Hooks (`useState`)

## What is it?
In React, components are generally "dumb"—they just render whatever data is passed to them. However, sometimes a component needs its own memory. It needs to remember things like "Did the user click the Aadhaar button or the Phone button?" 

`useState` is a React Hook that allows functional components to have state (memory).

## Why did we use it in the CTC App?
Take a look at `Login.jsx`. We have a toggle button at the top that switches between "Phone Number" and "Aadhaar".
If the user clicks "Aadhaar", we need the input placeholder to change from "e.g. 9876543210" to "12-digit Aadhaar Number". 

Without `useState`, React wouldn't know that it needs to re-render the screen to show the new placeholder.

## How the Code Works
In `Login.jsx`, we initialize the state like this:
```jsx
import React, { useState } from 'react';

function Login() {
  // 'loginMethod' holds the current value (starts as 'phone')
  // 'setLoginMethod' is the function we call to change the value
  const [loginMethod, setLoginMethod] = useState('phone');

  return (
    // If loginMethod is 'phone', show standard button, else show grayed out (secondary) button
    <button 
      className={loginMethod === 'phone' ? 'btn-primary' : 'btn-secondary'}
      onClick={() => setLoginMethod('phone')}
    >
      Phone Number
    </button>
  )
}
```
Whenever `setLoginMethod()` is called, React destroys the old UI and instantly repaints the screen with the new variable value in mind. This is the core "reactivity" of React.

## How to Learn It
1. **Official Docs**: The new React documentation is phenomenal. Read the section on [State: A Component's Memory](https://react.dev/learn/state-a-components-memory).
2. **Controlled Inputs**: The next step after toggling buttons is capturing what the user actually types into the text boxes. Look into "Controlled Components in React" to see how `useState` is used to capture input field keystrokes.
