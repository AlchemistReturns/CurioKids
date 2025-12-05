import { router } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, firestore } from "../../config/firebase";

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                router.replace("/index");
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        (async () => {
            try {
                const snap = await getDoc(doc(firestore, "users", user.uid));
                if (cancelled) return;
                if (snap.exists()) {
                    setRole((snap.data() as any).role ?? null);
                } else {
                    setRole(null);
                }
            } catch (e) {
                console.error("Failed to load parent linkKey", e);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [user]);

    if (role === "parent") {
        return require("../parent/dashboard").default;
    } else {
        return require("../child/dashboard").default;
    }
}
