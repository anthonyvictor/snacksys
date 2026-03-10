import { useState, useEffect } from "react";

export function useUserSession() {
  const [showModal, setShowModal] = useState(false);
  const [userData, setUserData] = useState<{
    name: string;
    phone: string;
  }>({ name: "", phone: "" });

  useEffect(() => {
    const savedData = localStorage.getItem("chat_user_info");
    if (savedData) {
      setUserData(JSON.parse(savedData));
    } else {
      setShowModal(true);
    }
  }, []);

  const saveSession = (name: string, phone: string) => {
    const data = { name, phone };
    localStorage.setItem("chat_user_info", JSON.stringify(data));
    setUserData(data);
    setShowModal(false);
  };

  return { showModal, userData, saveSession };
}
