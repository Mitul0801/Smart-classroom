import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBFcN4j-zcjqnjhoOPAdo7FLjIyBqtfN20",
  authDomain: "smart-classroom-3a3d1.firebaseapp.com",
  projectId: "smart-classroom-3a3d1",
  storageBucket: "smart-classroom-3a3d1.firebasestorage.app",
  messagingSenderId: "257963675231",
  appId: "1:257963675231:web:35378a137d8f69aee695ea"
};

async function diagnose() {
    console.log("🔍 Starting Firebase Diagnostic...");
    try {
        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        console.log("📡 Attempting to fetch 'attendance' collection...");
        const snapshot = await getDocs(collection(db, "attendance"));
        console.log(`✅ Success! Found ${snapshot.size} records.`);
        
        console.log("✍️ Attempting to write a test document to 'logs'...");
        await addDoc(collection(db, "logs"), {
            message: "Diagnostic test",
            timestamp: serverTimestamp()
        });
        console.log("✅ Success! Write permission confirmed.");
        
    } catch (error: any) {
        console.error("❌ Firebase Error detected:");
        console.error(`Code: ${error.code}`);
        console.error(`Message: ${error.message}`);
        if (error.message.includes("index")) {
            console.error("💡 Suggestion: You need to create a composite index. Check the link in the error above.");
        }
    }
}

diagnose();
