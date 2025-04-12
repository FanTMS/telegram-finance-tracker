import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string; // Название иконки из библиотеки
  createdBy: string;
}

export const useCategories = (userId: string) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка категорий
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const categoriesRef = collection(db, 'categories');
      const snapshot = await getDocs(categoriesRef);
      
      const categoryList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Category))
        .filter(category => category.createdBy === userId);
      
      setCategories(categoryList);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Не удалось загрузить категории. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  // Добавление новой категории
  const addCategory = async (category: Omit<Category, 'id' | 'createdBy'>) => {
    try {
      setError(null);
      
      const newCategory = {
        ...category,
        createdBy: userId
      };
      
      const docRef = await addDoc(collection(db, 'categories'), newCategory);
      
      setCategories(prev => [
        ...prev,
        { id: docRef.id, ...newCategory }
      ]);
      
      return docRef.id;
    } catch (err) {
      console.error('Error adding category:', err);
      setError('Не удалось добавить категорию. Пожалуйста, попробуйте позже.');
      return null;
    }
  };

  // Обновление категории
  const updateCategory = async (id: string, updates: Partial<Omit<Category, 'id' | 'createdBy'>>) => {
    try {
      setError(null);
      
      const categoryRef = doc(db, 'categories', id);
      await updateDoc(categoryRef, updates);
      
      setCategories(prev => 
        prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat)
      );
      
      return true;
    } catch (err) {
      console.error('Error updating category:', err);
      setError('Не удалось обновить категорию. Пожалуйста, попробуйте позже.');
      return false;
    }
  };

  // Удаление категории
  const deleteCategory = async (id: string) => {
    try {
      setError(null);
      
      const categoryRef = doc(db, 'categories', id);
      await deleteDoc(categoryRef);
      
      setCategories(prev => prev.filter(cat => cat.id !== id));
      
      return true;
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Не удалось удалить категорию. Пожалуйста, попробуйте позже.');
      return false;
    }
  };

  // Получение категории по ID
  const getCategoryById = (id: string) => {
    return categories.find(cat => cat.id === id) || null;
  };

  // Загружаем категории при первой загрузке компонента
  useEffect(() => {
    if (userId) {
      fetchCategories();
    }
  }, [userId]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById
  };
}; 