import { useState, useEffect, useRef } from "react";
import { auth, db } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import "./App.css";

// Import dnd-kit
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Komponen Khusus untuk Item yang Bisa Di-drag
function SortableItem(props) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: transform ? 999 : "auto",
    position: "relative",
  };

  return (
    <li ref={setNodeRef} className="sortable-row" style={style}>
      <div className="sortable-content">
        <button
          {...attributes}
          {...listeners}
          className="drag-handle"
          title="Geser untuk memindahkan"
          aria-label="Geser untuk memindahkan menu"
        >
          <span aria-hidden="true">⠿</span>
        </button>
        <span className="sortable-name">{props.item}</span>
      </div>

      <div className="row-actions">
        <button 
          onClick={() => props.onEdit(props.index)}
          className="action-icon-button edit-action"
          title="Edit item ini"
          aria-label={`Edit ${props.item}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 5 4 4M4 20l4-.8L19.2 8a2.1 2.1 0 0 0-3-3L5 16.2 4 20Z" />
          </svg>
        </button>
        <button 
          onClick={() => props.onDelete(props.index)}
          className="action-icon-button delete-action"
          title="Hapus item ini"
          aria-label={`Hapus ${props.item}`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" />
          </svg>
        </button>
      </div>
    </li>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [menuList, setMenuList] = useState([]);
  const [exclusionList, setExclusionList] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [newExclusion, setNewExclusion] = useState("");
  const [isExclusionOpen, setIsExclusionOpen] = useState(false);
  const [menuEdit, setMenuEdit] = useState(null);
  const [isSavingMenuEdit, setIsSavingMenuEdit] = useState(false);
  const [exclusionEdit, setExclusionEdit] = useState(null);
  const [isSavingExclusionEdit, setIsSavingExclusionEdit] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [undoStack, setUndoStack] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [deleteUndo, setDeleteUndo] = useState(null);
  const deleteUndoSequence = useRef(0);
  const activeDeleteUndoId = deleteUndo?.id;
  const isMenuEditOpen = menuEdit !== null;
  const isExclusionEditOpen = exclusionEdit !== null;
  const isModalOpen = isExclusionOpen || isMenuEditOpen || isExclusionEditOpen || isLogoutDialogOpen;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 1. Pantau status Autentikasi
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setMenuList([]);
        setExclusionList([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch data antrean secara realtime menggunakan jalur referensi asli: users/{uid}/siklus/antrean
  useEffect(() => {
    if (!user) return;
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

  useEffect(() => {
    let scrollTimeout;
    const handleScroll = () => {
      setIsScrolling(true);
      window.clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => setIsScrolling(false), 700);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.clearTimeout(scrollTimeout);
    };
  }, []);

  useEffect(() => {
    if (activeDeleteUndoId === undefined) return;

    const timeoutId = window.setTimeout(() => {
      setDeleteUndo((currentNotice) => (
        currentNotice?.id === activeDeleteUndoId ? null : currentNotice
      ));
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [activeDeleteUndoId]);

  useEffect(() => {
    if (!isModalOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (!isMenuEditOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSavingMenuEdit) {
        setMenuEdit(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuEditOpen, isSavingMenuEdit]);

  useEffect(() => {
    if (!isExclusionEditOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSavingExclusionEdit) {
        setExclusionEdit(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExclusionEditOpen, isSavingExclusionEdit]);

  useEffect(() => {
    if (!isLogoutDialogOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSigningOut) {
        setIsLogoutDialogOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLogoutDialogOpen, isSigningOut]);

  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, "users", user.uid, "siklus", "pengecualian");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      const list = docSnap.exists() ? docSnap.data().list || [] : [];
      setExclusionList(list
        .map((item) => typeof item === "string" ? item : item.name)
        .filter(Boolean));
    });

    return () => unsubscribe();
  }, [user]);

  // Fungsi utilitas penyimpanan sesuai referensi asli
  const saveList = async (newList) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid, "siklus", "antrean");
    await setDoc(docRef, { list: newList }, { merge: true });
  };

  const saveExclusionList = async (newList) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid, "siklus", "pengecualian");
    await setDoc(docRef, { list: newList }, { merge: true });
  };

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login gagal", error);
    }
  };

  const handleLogout = () => {
    setLogoutError("");
    setIsLogoutDialogOpen(true);
  };

  const handleConfirmLogout = async () => {
    setIsSigningOut(true);
    setLogoutError("");
    try {
      await signOut(auth);
      setIsLogoutDialogOpen(false);
    } catch (error) {
      console.error("Logout gagal", error);
      setLogoutError("Tidak dapat keluar saat ini. Silakan coba lagi.");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    const newItemsArray = newItem
      .split('\n')
      .map(item => item.trim())
      .filter(item => item !== "");

    if (newItemsArray.length === 0) return;

    const conflictingMenus = newItemsArray.flatMap((item) => {
      const matchingKeywords = exclusionList.filter((keyword) =>
        item.toLowerCase().includes(keyword.toLowerCase())
      );

      return matchingKeywords.length > 0
        ? [`• ${item} — ${matchingKeywords.join(", ")}`]
        : [];
    });

    if (conflictingMenus.length > 0) {
      const shouldAddAnyway = window.confirm(
        `Menu berikut cocok dengan keyword pengecualian:\n\n${conflictingMenus.join("\n")}\n\nTetap tambahkan menu ini?`
      );
      if (!shouldAddAnyway) return;
    }

    setUndoStack([]);
    const newList = [...menuList, ...newItemsArray];
    await saveList(newList);
    setNewItem("");
  };

  const handlePutarSiklus = async () => {
    if (menuList.length < 2) return; 
    setUndoStack([...undoStack, menuList]);

    const newList = [...menuList];
    const itemDipindah = newList.pop(); // Dari bawah
    newList.unshift(itemDipindah);      // Dipindah ke atas
    
    await saveList(newList);
  };

  const handleUndo = async () => {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    setUndoStack(undoStack.slice(0, -1));
    await saveList(previousState);
  };

  const handleDelete = async (indexToRemove) => {
    setUndoStack([]);
    const deletedItem = menuList[indexToRemove];
    if (deletedItem === undefined) return;

    const newList = menuList.filter((_, index) => index !== indexToRemove);
    await saveList(newList);
    setDeleteUndo({
      id: ++deleteUndoSequence.current,
      listType: "menu",
      item: deletedItem,
      previousList: menuList,
    });
  };

  const handleDeleteAll = async () => {
    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus SELURUH daftar antrean? Tindakan ini tidak dapat dibatalkan.");
    if (confirmDelete) {
      setUndoStack([]);
      await saveList([]); 
    }
  };

  const handleEdit = (index) => {
    const item = menuList[index];
    if (item === undefined) return;
    setMenuEdit({ index, value: item });
  };

  const handleSaveMenuEdit = async (event) => {
    event.preventDefault();
    const updatedItem = menuEdit?.value.trim();
    if (!menuEdit || !updatedItem || menuList[menuEdit.index] === undefined) return;

    const updatedList = [...menuList];
    updatedList[menuEdit.index] = updatedItem;
    setIsSavingMenuEdit(true);
    try {
      await saveList(updatedList);
      setUndoStack([]);
      setMenuEdit(null);
    } finally {
      setIsSavingMenuEdit(false);
    }
  };

  const handleAddExclusion = async (event) => {
    event.preventDefault();
    const newItems = newExclusion
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    if (newItems.length === 0) return;

    await saveExclusionList([...exclusionList, ...newItems]);
    setNewExclusion("");
  };

  const handleEditExclusion = (index) => {
    const item = exclusionList[index];
    if (item === undefined) return;
    setExclusionEdit({ index, value: item });
  };

  const handleSaveExclusionEdit = async (event) => {
    event.preventDefault();
    const updatedItem = exclusionEdit?.value.trim();
    if (!exclusionEdit || !updatedItem || exclusionList[exclusionEdit.index] === undefined) return;

    const updatedList = [...exclusionList];
    updatedList[exclusionEdit.index] = updatedItem;
    setIsSavingExclusionEdit(true);
    try {
      await saveExclusionList(updatedList);
      setExclusionEdit(null);
    } finally {
      setIsSavingExclusionEdit(false);
    }
  };

  const handleDeleteExclusion = async (indexToRemove) => {
    const deletedItem = exclusionList[indexToRemove];
    if (deletedItem === undefined) return;

    await saveExclusionList(exclusionList.filter((_, index) => index !== indexToRemove));
    setDeleteUndo({
      id: ++deleteUndoSequence.current,
      listType: "exclusion",
      item: deletedItem,
      previousList: exclusionList,
    });
  };

  const handleUndoDelete = async () => {
    if (!deleteUndo || deleteUndo.isUndoing) return;

    const notice = deleteUndo;
    setDeleteUndo({ ...notice, isUndoing: true });

    let restored = false;
    try {
      if (notice.listType === "menu") {
        await saveList(notice.previousList);
      } else {
        await saveExclusionList(notice.previousList);
      }
      restored = true;
    } finally {
      setDeleteUndo((currentNotice) => {
        if (currentNotice?.id !== notice.id) return currentNotice;
        return restored ? null : { ...currentNotice, isUndoing: false };
      });
    }
  };

  const scrollPage = (position) => {
    window.scrollTo({
      top: position === "top" ? 0 : document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  // Logika Drag and Drop menggunakan dnd-kit (aman untuk iPhone & Android)
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setUndoStack([]);
      const oldIndex = menuList.findIndex((_, index) => `item-${index}` === active.id);
      const newIndex = menuList.findIndex((_, index) => `item-${index}` === over.id);

      const newList = arrayMove(menuList, oldIndex, newIndex);
      await saveList(newList);
    }
  };

  const renderDeleteUndoToast = () => {
    if (!deleteUndo) return null;

    return (
      <div
        className="delete-undo-toast"
        role="status"
        aria-live="polite"
      >
        <span>
          {deleteUndo.listType === "menu" ? "Menu" : "Pengecualian"} &quot;{deleteUndo.item}&quot; dihapus
        </span>
        <button onClick={handleUndoDelete} disabled={deleteUndo.isUndoing}>
          {deleteUndo.isUndoing ? "Memulihkan..." : "Urungkan"}
        </button>
        <span className="delete-undo-progress" aria-hidden="true" />
      </div>
    );
  };

  if (loading) {
    return (
      <main className="loading-screen" aria-live="polite">
        <img className="brand-mark" src={`${import.meta.env.BASE_URL}favicon.png`} alt="" aria-hidden="true" />
        <span className="loading-indicator" />
        <p>Menyiapkan siklus makan...</p>
      </main>
    );
  }

  return (
    <div className={`app-shell ${user ? "is-signed-in" : "is-welcome"}`}>
      <header className="app-header">
        <div className="brand-lockup">
          <img className="brand-mark" src={`${import.meta.env.BASE_URL}favicon.png`} alt="" aria-hidden="true" />
          <span className="brand-copy">
            <strong>Rotasi Makan</strong>
            <small>SIKLUS MAKAN PRIBADI</small>
          </span>
        </div>
        {user && (
          <div className="user-tools">
            {user.photoURL ? (
              <img className="user-avatar" src={user.photoURL} alt="" />
            ) : (
              <span className="user-avatar user-avatar-fallback" aria-hidden="true">
                {(user.displayName || "U").charAt(0).toUpperCase()}
              </span>
            )}
            <span className="user-name">{user.displayName || "Pengguna"}</span>
            <button className="logout-button" onClick={handleLogout} title="Keluar">
              <span aria-hidden="true">↗</span>
              Keluar
            </button>
          </div>
        )}
      </header>

      {!user ? (
        <main className="welcome-page">
          <section className="welcome-visual">
            <img
              src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1800&q=85"
              alt="Mangkuk makan berisi sayuran segar dan bahan berwarna-warni"
            />
            <div className="welcome-copy">
              <span className="eyebrow">PILIHAN HARIAN, LEBIH TERATUR</span>
              <h1>Putar pilihan.<br />Nikmati makan.</h1>
            </div>
            <span className="image-caption">CATATAN SIKLUS MAKAN</span>
          </section>
          <section className="welcome-bottom">
            <div className="welcome-note">
              <h2>Semua pilihan makan, dalam satu daftar.</h2>
              <p>Masuk untuk membuka antrean dan catatan pengecualian Anda.</p>
            </div>
            <button className="google-button" onClick={login}>
              <span className="google-mark" aria-hidden="true">G</span>
              Masuk dengan Google
              <span className="button-arrow" aria-hidden="true">→</span>
            </button>
          </section>
        </main>
      ) : (
        <main className="main-content">
          <section className="page-intro">
            <div>
              <span className="eyebrow">RUANG MAKAN PRIBADI</span>
              <h1>Siklus makan</h1>
              <p>Kelola pilihan untuk giliran makan berikutnya.</p>
            </div>
            <span className="date-stamp">DAFTAR AKTIF <strong>{menuList.length.toString().padStart(2, "0")}</strong></span>
          </section>

          <section className="rotation-panel" aria-label="Kontrol rotasi menu">
            <div className="rotation-copy">
              <span className="panel-kicker">GILIRAN BERIKUTNYA</span>
              <strong>{menuList.length > 0 ? menuList[menuList.length - 1] : "Siapkan antrean makanmu"}</strong>
              <span className="rotation-caption">
                {menuList.length > 1 ? "Putar untuk membawa pilihan berikutnya ke posisi teratas." : "Tambahkan setidaknya dua pilihan untuk mulai memutar."}
              </span>
            </div>
            <div className="rotation-actions">
              <button
                className="rotate-button"
                onClick={handlePutarSiklus}
                disabled={menuList.length < 2}
              >
                <span aria-hidden="true">↻</span>
                Saya makan sekarang
              </button>
              {undoStack.length > 0 && (
                <button className="undo-button" onClick={handleUndo} title="Batalkan rotasi terakhir">
                  <span aria-hidden="true">↶</span>
                  <span>Urungkan <strong>{undoStack.length}</strong></span>
                </button>
              )}
            </div>
          </section>

          <section className="queue-section">
            <div className="section-heading">
              <div className="section-title">
                <h2>Urutan antrean</h2>
                <span className="queue-count">{menuList.length} menu</span>
              </div>
              {menuList.length > 0 && (
                <button className="text-action delete-all-button" onClick={handleDeleteAll}>
                  <span aria-hidden="true">⌫</span>
                  Hapus semua
                </button>
              )}
            </div>

            <form className="queue-form" onSubmit={handleAdd}>
              <textarea
                placeholder="Ketik atau paste daftar menu, satu menu per baris..."
                value={newItem}
                onChange={(event) => setNewItem(event.target.value)}
                aria-label="Daftar menu baru, satu menu per baris"
              />
              <button type="submit" className="add-button">
                <span aria-hidden="true">＋</span>
                Tambah menu
              </button>
            </form>

            {menuList.length === 0 ? (
              <div className="queue-empty">
                <span className="empty-mark" aria-hidden="true">＋</span>
                <p>Belum ada menu di antrean.</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={menuList.map((_, index) => `item-${index}`)} strategy={verticalListSortingStrategy}>
                  <ul className="queue-list">
                    {menuList.map((item, index) => (
                      <SortableItem
                        key={`item-${index}`}
                        id={`item-${index}`}
                        item={item}
                        index={index}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </section>
        </main>
      )}

      {user && (
        <>
          {menuList.length > 7 && (
            <div
              className={`page-scroll-actions${isScrolling ? " is-scrolling" : ""}`}
              aria-label="Navigasi antrean"
              aria-hidden={isScrolling}
            >
              <button onClick={() => scrollPage("top")} title="Ke bagian atas" aria-label="Ke bagian atas antrean" disabled={isScrolling}>↑</button>
              <button onClick={() => scrollPage("bottom")} title="Ke bagian bawah" aria-label="Ke bagian bawah antrean" disabled={isScrolling}>↓</button>
            </div>
          )}
          <button
            className={`exclusion-fab${isScrolling ? " is-scrolling" : ""}`}
            onClick={() => setIsExclusionOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isExclusionOpen}
            aria-hidden={isScrolling}
            disabled={isScrolling}
          >
            <span aria-hidden="true">⊖</span>
            <span>Pengecualian</span>
            <span className="exclusion-count">{exclusionList.length}</span>
          </button>

          {isExclusionOpen && (
            <div className="exclusion-overlay" onClick={() => setIsExclusionOpen(false)}>
              <section
                className="exclusion-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="exclusion-title"
                onClick={(event) => event.stopPropagation()}
              >
                <header className="exclusion-header">
                  <div>
                    <span className="eyebrow">CATATAN PRIBADI</span>
                    <h2 id="exclusion-title">Daftar Pengecualian</h2>
                    <p>Hal-hal yang ingin kamu hindari saat memilih makan.</p>
                  </div>
                  <button
                    className="exclusion-close"
                    onClick={() => setIsExclusionOpen(false)}
                    aria-label="Tutup daftar pengecualian"
                  >
                    ×
                  </button>
                </header>

                <form className="exclusion-form" onSubmit={handleAddExclusion}>
                  <textarea
                    value={newExclusion}
                    onChange={(event) => setNewExclusion(event.target.value)}
                    placeholder="Tulis daftar pengecualian, satu item per baris..."
                    aria-label="Daftar pengecualian, satu item per baris"
                    required
                  />
                  <button type="submit" className="add-button">
                    <span aria-hidden="true">＋</span>
                    Tambah
                  </button>
                </form>

                <div className="exclusion-list" aria-live="polite">
                  {exclusionList.length === 0 ? (
                    <p className="exclusion-empty">Belum ada pengecualian.</p>
                  ) : (
                    <ul>
                      {exclusionList.map((item, index) => (
                        <li key={`${item}-${index}`}>
                          <div className="exclusion-item-copy">
                            <span>{item}</span>
                          </div>
                          <div className="exclusion-actions">
                            <button className="action-icon-button edit-action" onClick={() => handleEditExclusion(index)} aria-label={`Edit ${item}`} title="Edit">
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="m15 5 4 4M4 20l4-.8L19.2 8a2.1 2.1 0 0 0-3-3L5 16.2 4 20Z" />
                              </svg>
                            </button>
                            <button className="action-icon-button delete-action" onClick={() => handleDeleteExclusion(index)} aria-label={`Hapus ${item}`} title="Hapus">
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                              </svg>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          )}
        </>
      )}
      {menuEdit && (
        <div
          className="menu-edit-overlay"
          onClick={() => !isSavingMenuEdit && setMenuEdit(null)}
        >
          <section
            className="menu-edit-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="menu-edit-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="menu-edit-header">
              <span className="eyebrow">ANTREAN MENU</span>
              <h2 id="menu-edit-title">Edit menu</h2>
              <p>Perbarui nama menu atau catatan ini.</p>
            </header>
            <form className="menu-edit-form" onSubmit={handleSaveMenuEdit}>
              <label htmlFor="menu-edit-input">Nama menu atau catatan</label>
              <input
                id="menu-edit-input"
                type="text"
                value={menuEdit.value}
                onChange={(event) => setMenuEdit({ ...menuEdit, value: event.target.value })}
                autoFocus
                required
              />
              <div className="menu-edit-actions">
                <button
                  type="button"
                  className="menu-edit-cancel"
                  onClick={() => setMenuEdit(null)}
                  disabled={isSavingMenuEdit}
                >
                  Batal
                </button>
                <button type="submit" className="add-button" disabled={isSavingMenuEdit}>
                  {isSavingMenuEdit ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {exclusionEdit && (
        <div
          className="menu-edit-overlay"
          onClick={() => !isSavingExclusionEdit && setExclusionEdit(null)}
        >
          <section
            className="menu-edit-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exclusion-edit-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="menu-edit-header">
              <span className="eyebrow">CATATAN PRIBADI</span>
              <h2 id="exclusion-edit-title">Edit pengecualian</h2>
              <p>Perbarui keyword atau catatan yang ingin dihindari.</p>
            </header>
            <form className="menu-edit-form" onSubmit={handleSaveExclusionEdit}>
              <label htmlFor="exclusion-edit-input">Keyword pengecualian</label>
              <input
                id="exclusion-edit-input"
                type="text"
                value={exclusionEdit.value}
                onChange={(event) => setExclusionEdit({ ...exclusionEdit, value: event.target.value })}
                autoFocus
                required
              />
              <div className="menu-edit-actions">
                <button
                  type="button"
                  className="menu-edit-cancel"
                  onClick={() => setExclusionEdit(null)}
                  disabled={isSavingExclusionEdit}
                >
                  Batal
                </button>
                <button type="submit" className="add-button" disabled={isSavingExclusionEdit}>
                  {isSavingExclusionEdit ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {user && isLogoutDialogOpen && (
        <div
          className="menu-edit-overlay"
          onClick={() => !isSigningOut && setIsLogoutDialogOpen(false)}
        >
          <section
            className="menu-edit-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="menu-edit-header">
              <span className="eyebrow">AKUN SIKLUS MAKAN</span>
              <h2 id="logout-dialog-title">Keluar dari akun?</h2>
              <p>Anda perlu masuk kembali untuk mengakses antrean dan daftar pengecualian.</p>
            </header>
            <div className="logout-dialog-content">
              {logoutError && <p className="logout-dialog-error" role="alert">{logoutError}</p>}
              <div className="menu-edit-actions">
                <button
                  type="button"
                  className="menu-edit-cancel"
                  onClick={() => setIsLogoutDialogOpen(false)}
                  disabled={isSigningOut}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="logout-confirm-button"
                  onClick={handleConfirmLogout}
                  disabled={isSigningOut}
                  autoFocus
                >
                  {isSigningOut ? "Keluar..." : "Keluar"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
      {renderDeleteUndoToast()}
    </div>
  );
}

export default App;