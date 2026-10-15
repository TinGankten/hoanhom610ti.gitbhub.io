(() => {
  const firebaseAuthReady = Promise.all([
    import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"),
  ]).then(([appSdk, authSdk, firestoreSdk]) => {
    const firebaseConfig = {
      apiKey: "AIzaSyCsCXRX-z68Z6xoCLKTcL8FyA7ixXQPVTs",
      authDomain: "combat-code-app.firebaseapp.com",
      projectId: "combat-code-app",
      storageBucket: "combat-code-app.firebasestorage.app",
      messagingSenderId: "904298272482",
      appId: "1:904298272482:web:6030b5597b78b77678b0bb",
      measurementId: "G-W7TCMH53KN",
    };
    const app = appSdk.initializeApp(firebaseConfig);
    const auth = authSdk.getAuth(app);

    return {
      auth,
      db: firestoreSdk.getFirestore(app),
      createUserWithEmailAndPassword: (email, password) =>
        authSdk.createUserWithEmailAndPassword(auth, email, password),
      onAuthStateChanged: (callback, errorCallback) =>
        authSdk.onAuthStateChanged(auth, callback, errorCallback),
      signInWithEmailAndPassword: (email, password) =>
        authSdk.signInWithEmailAndPassword(auth, email, password),
      signOut: () => authSdk.signOut(auth),
    };
  });

  window.firebaseAuthReady = firebaseAuthReady;
})();
