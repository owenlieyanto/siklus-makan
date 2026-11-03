import React, { useState, useEffect, useRef } from "react";
import { auth, googleProvider, db, loginWithGoogle, logout } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State untuk daftar makanan
  const [menuList, setMenuList] = useState([]);
  const [newItem, setNewItem] = useState("");

  // State untuk riwayat rotasi (Undo)
  const [undoStack, setUndoStack] = useState([]);

  // Referensi untuk menyimpan indeks item yang sedang ditarik dan posisi tujuannya
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  // Fungsi untuk mengeksekusi perpindahan posisi
  const handleSort = async () => {
    setUndoStack([]); // Reset undo jika ada perubahan manual
    const newList = [...menuList];
    const draggedItemContent = newList.splice(dragItem.current, 1)[0];
    newList.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    await saveList(newList);
  };

  // 1. Pantau status Autentikasi
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch data antrean secara realtime
  useEffect(() => {
    if (!user) {
      setMenuList([]);
      return;
    }
    const docRef = doc(db, "users", user.uid, "siklus", "antrean");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setMenuList(docSnap.data().list || []);
      } else {
        setMenuList([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Fungsi utilitas untuk menyimpan array baru ke Firestore
  const saveList = async (newList) => {
    const docRef = doc(db, "users", user.uid, "siklus", "antrean");
    await setDoc(docRef, { list: newList }, { merge: true });
  };

  // 3. Tambah menu baru ke urutan paling bawah
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    // Pisahkan teks berdasarkan baris baru, bersihkan spasi ekstra, dan buang baris kosong
    const newItemsArray = newItem
      .split('\n')
      .map(item => item.trim())
      .filter(item => item !== "");

    if (newItemsArray.length === 0) return;

    setUndoStack([]); // Reset undo jika ada perubahan manual
    const newList = [...menuList, ...newItemsArray];
    await saveList(newList);
    setNewItem("");
  };

  // 4. Hapus menu dari daftar
  const handleDelete = async (indexToRemove) => {
    setUndoStack([]); // Reset undo jika ada perubahan manual
    const newList = menuList.filter((_, index) => index !== indexToRemove);
    await saveList(newList);
  };

  // Hapus semua menu dengan konfirmasi
  const handleDeleteAll = async () => {
    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus SELURUH daftar antrean? Tindakan ini tidak dapat dibatalkan.");
    if (confirmDelete) {
      setUndoStack([]); // Reset undo
      await saveList([]); 
    }
  };

  // Fungsi untuk mengedit teks item
  const handleEdit = async (index) => {
    const teksLama = menuList[index];
    const teksBaru = window.prompt("Edit menu/catatan:", teksLama);
    
    if (teksBaru !== null && teksBaru.trim() !== "") {
      setUndoStack([]); // Reset undo jika ada perubahan manual
      const newList = [...menuList];
      newList[index] = teksBaru.trim();
      await saveList(newList);
    }
  };

  // 5. ROTASI SIKLUS (Tombol Makan: Bawah ke Atas)
  const handlePutarSiklus = async () => {
    if (menuList.length < 2) return; 
    
    // Simpan status saat ini ke dalam riwayat undo sebelum diputar
    setUndoStack([...undoStack, menuList]);

    const newList = [...menuList];
    const itemDipindah = newList.pop(); // Cabut dari bawah
    newList.unshift(itemDipindah);      // Masukkan ke posisi paling atas
    
    await saveList(newList);
  };

  // 6. UNDO ROTASI
  const handleUndo = async () => {
    if (undoStack.length === 0) return;
    
    // Ambil status array sebelum rotasi terakhir
    const previousState = undoStack[undoStack.length - 1];
    
    // Hapus status tersebut dari tumpukan undo (pop)
    setUndoStack(undoStack.slice(0, -1));
    
    // Simpan kembali status sebelumnya ke database
    await saveList(previousState);
  };

  // 7. KONFIRMASI KELUAR
  const handleLogout = () => {
    const confirmLogout = window.confirm("Apakah Anda yakin ingin keluar dari aplikasi?");
    if (confirmLogout) {
      logout();
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>Memuat aplikasi...</div>;
  }

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "1.5rem", fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h2>Rotasi Siklus Makan</h2>
        {user && (
          <button onClick={logout} style={{ padding: "0.4rem 0.8rem", cursor: "pointer" }}>Keluar</button>
        )}
      </header>

      {!user ? (
        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <p>Silakan masuk untuk mengelola antrean siklus makan Anda.</p>
          <button 
            onClick={loginWithGoogle} 
            style={{ padding: "0.6rem 1.2rem", fontSize: "1rem", cursor: "pointer", borderRadius: "6px" }}
          >
            Masuk dengan Google
          </button>
        </div>
      ) : (
        <main>
          {/* Tombol Utama Rotasi & Tombol Undo */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "1.5rem" }}>
            <button 
              onClick={handlePutarSiklus}
              style={{ 
                flex: 1, padding: "1rem", fontSize: "1.2rem", fontWeight: "bold",
                background: "#28a745", color: "#fff", border: "none", borderRadius: "8px", 
                cursor: "pointer" 
              }}
            >
              🍽️ SAYA MAKAN SEKARANG (Putar Siklus)
            </button>

            {undoStack.length > 0 && (
              <button
                onClick={handleUndo}
                style={{
                  padding: "0 1.2rem", fontSize: "1.5rem",
                  background: "#6c757d", color: "#fff", border: "none", borderRadius: "8px",
                  cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
                }}
                title="Batalkan rotasi terakhir"
              >
                <span>↩️</span>
                <span style={{ fontSize: "0.75rem", fontWeight: "bold", marginTop: "2px" }}>{undoStack.length}</span>
              </button>
            )}
          </div>

          {/* Form Tambah Menu */}
          <form onSubmit={handleAdd} style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
            <textarea 
              placeholder="Ketik atau paste daftar menu di sini (satu menu per baris)..." 
              value={newItem} 
              onChange={(e) => setNewItem(e.target.value)} 
              style={{ flex: 1, padding: "0.6rem", borderRadius: "4px", border: "1px solid #ccc", minHeight: "80px", resize: "vertical" }}
            />
            <button type="submit" style={{ padding: "0.6rem 1rem", background: "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              Tambah
            </button>
          </form>

          {/* Daftar Antrean Siklus */}
          <div style={{ background: "#f4f4f4", padding: "1rem", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h4 style={{ margin: 0 }}>Urutan Antrean:</h4>
              {menuList.length > 0 && (
                <button 
                  onClick={handleDeleteAll}
                  style={{ background: "#dc3545", color: "#fff", border: "none", padding: "0.4rem 0.8rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold" }}
                >
                  ⚠️ Hapus Semua
                </button>
              )}
            </div>
            
            {menuList.length === 0 ? (
              <p style={{ color: "#666", fontSize: "0.9rem", marginTop: 0 }}>Daftar masih kosong.</p>
            ) : (
              <ol style={{ paddingLeft: "0", margin: 0, lineHeight: "1.8", listStyleType: "none" }}>
              {menuList.map((item, index) => (
                <li 
                  key={index} 
                  draggable 
                  onDragStart={(e) => (dragItem.current = index)}
                  onDragEnter={(e) => (dragOverItem.current = index)}
                  onDragEnd={handleSort}
                  onDragOver={(e) => e.preventDefault()} 
                  style={{ 
                    borderBottom: "1px solid #ddd", 
                    padding: "0.6rem 0.4rem", 
                    display: "flex", 
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "grab", 
                    backgroundColor: "#fff"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ color: "#aaa", cursor: "grab" }}>☰</span>
                    <span>{item}</span>
                  </div>
                  
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button 
                      onClick={() => handleEdit(index)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}
                      title="Edit item ini"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDelete(index)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem" }}
                      title="Hapus item ini"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ol>
            )}
          </div>
        </main>
      )}
    </div>
  );
}