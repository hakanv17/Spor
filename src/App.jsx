import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabaseClient';
import {
  Activity,
  Droplet,
  Flame,
  Calendar,
  Settings,
  User,
  Plus,
  Trash2,
  Check,
  Compass,
  Trophy,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  Copy
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';

export default function App() {
  // --- 1. State Yönetimi (Profil Hakan olarak kilitlendi) ---
  const userId = 'Hakan';
  const userNickname = 'Hakan';

  // Hakan'ın Boyu (cm) - LocalStorage'da saklanır veya varsayılan 172'dir
  const [userHeight, setUserHeight] = useState(() => {
    return parseInt(localStorage.getItem('pulse_height') || '172', 10);
  });

  // Haftanın Pazartesi Gününü Bulma Yardımcısı
  function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(date.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    return mon;
  }

  // Seçili olan haftanın Pazartesi günü (Date nesnesi)
  const [currentWeekMonday, setCurrentWeekMonday] = useState(() => getMonday(new Date()));

  const [dailyWaterGoal, setDailyWaterGoal] = useState(() => {
    return parseInt(localStorage.getItem('pulse_water_goal') || '2000', 10);
  });

  const [dailyRunningGoal, setDailyRunningGoal] = useState(() => {
    return parseFloat(localStorage.getItem('pulse_running_goal') || '5');
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activities, setActivities] = useState([]);
  const [waterLogs, setWaterLogs] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  
  // Yeni: Kilo ve Kalori Takip State'leri
  const [weightLogs, setWeightLogs] = useState([]);
  const [calorieLogs, setCalorieLogs] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Database Fallback Bayrağı
  const [dbFallback, setDbFallback] = useState(false);

  // Form State'leri
  const [sportForm, setSportForm] = useState({
    type: 'strength',
    duration: '',
    calories: '',
    distance: '',
    date: getLocalDateString(),
    notes: ''
  });

  const [runForm, setRunForm] = useState({
    duration: '',
    distance: '',
    date: getLocalDateString(),
    notes: ''
  });

  const [waterAmount, setWaterAmount] = useState('');

  // Yeni: Kilo ve Kalori Form State'leri
  const [weightInput, setWeightInput] = useState('');
  const [weightDate, setWeightDate] = useState(getLocalDateString());

  const [calorieInput, setCalorieInput] = useState('');
  const [calorieNotes, setCalorieNotes] = useState('');
  const [calorieDate, setCalorieDate] = useState(getLocalDateString());
  
  // Antrenman Modal State'leri
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [workoutForm, setWorkoutForm] = useState({
    dayOfWeek: 1,
    title: '',
    description: '',
    timeOfDay: '08:00'
  });

  const [draggedOverDay, setDraggedOverDay] = useState(null);

  // --- 2. Yardımcı Fonksiyonlar ---
  function showToast(message, type = 'success') {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  // Yerel Saat Dilimine Göre YYYY-MM-DD oluşturucu
  function getLocalDateString(d = new Date()) {
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  }

  // --- 3. Supabase Veri Çekme ---
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    let success = true;

    // 1. Aktiviteleri Çek
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.warn('Activities fetch failed, using fallback:', err);
      success = false;
      const localData = JSON.parse(localStorage.getItem(`pulse_fallback_activities_${userId}`) || '[]');
      setActivities(localData);
    }

    // 2. Su Kayıtlarını Çek
    try {
      const { data, error } = await supabase
        .from('water_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWaterLogs(data || []);
    } catch (err) {
      console.warn('Water logs fetch failed, using fallback:', err);
      success = false;
      const localData = JSON.parse(localStorage.getItem(`pulse_fallback_water_${userId}`) || '[]');
      setWaterLogs(localData);
    }

    // 3. Antrenman Takvimini Çek
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('time_of_day', { ascending: true });

      if (error) throw error;
      setWorkouts(data || []);
    } catch (err) {
      console.warn('Workouts fetch failed, using fallback:', err);
      success = false;
      const localData = JSON.parse(localStorage.getItem(`pulse_fallback_workouts_${userId}`) || '[]');
      setWorkouts(localData);
    }

    // 4. Kilo Kayıtlarını Çek
    try {
      const { data, error } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWeightLogs(data || []);
    } catch (err) {
      console.warn('Weight logs fetch failed, using fallback:', err);
      success = false;
      const localData = JSON.parse(localStorage.getItem(`pulse_fallback_weight_${userId}`) || '[]');
      setWeightLogs(localData);
    }

    // 5. Kalori Alımı Kayıtlarını Çek
    try {
      const { data, error } = await supabase
        .from('calorie_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCalorieLogs(data || []);
    } catch (err) {
      console.warn('Calorie logs fetch failed, using fallback:', err);
      success = false;
      const localData = JSON.parse(localStorage.getItem(`pulse_fallback_calories_${userId}`) || '[]');
      setCalorieLogs(localData);
    }

    if (!success) {
      setDbFallback(true);
      showToast('Supabase bağlantısı kurulamadı. Veriler yerelde saklanıyor.', 'error');
    } else {
      setDbFallback(false);
      showToast('Supabase verileri senkronize edildi.', 'success');
    }
    setLoading(false);
  };

  // --- 4. Sürükle Bırak (Drag & Drop) Mantığı ---
  const handleDragStart = (e, workoutId) => {
    e.dataTransfer.setData('text/plain', workoutId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, dayNum) => {
    e.preventDefault();
    if (draggedOverDay !== dayNum) {
      setDraggedOverDay(dayNum);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverDay(null);
  };

  const handleDrop = async (e, targetDayOfWeek) => {
    e.preventDefault();
    setDraggedOverDay(null);
    const workoutId = e.dataTransfer.getData('text/plain');
    if (!workoutId) return;

    // Antrenmanı bul
    const targetWorkout = workouts.find((w) => String(w.id) === String(workoutId));
    if (!targetWorkout) return;

    const currentMonStr = getLocalDateString(currentWeekMonday);

    // Aynı gün ve aynı haftaysa işlem yapma
    if (targetWorkout.day_of_week === targetDayOfWeek && targetWorkout.week_start === currentMonStr) return;

    // Ekranda hızlıca güncelle
    setWorkouts((prev) =>
      prev.map((w) => (String(w.id) === String(workoutId) ? { ...w, day_of_week: targetDayOfWeek, week_start: currentMonStr } : w))
    );

    const targetIdStr = String(workoutId);
    if (!dbFallback && !targetIdStr.startsWith('local_')) {
      try {
        const { error } = await supabase
          .from('workouts')
          .update({ day_of_week: targetDayOfWeek, week_start: currentMonStr })
          .eq('id', workoutId);

        if (error) throw error;
        showToast('Antrenman taşındı.');
      } catch (err) {
        console.error('Supabase drag-drop update failed:', err);
        updateWorkoutDayLocal(workoutId, targetDayOfWeek, currentMonStr);
      }
    } else {
      updateWorkoutDayLocal(workoutId, targetDayOfWeek, currentMonStr);
    }
  };

  const updateWorkoutDayLocal = (id, targetDay, weekStartStr) => {
    const updated = workouts.map((w) => (w.id === id ? { ...w, day_of_week: targetDay, week_start: weekStartStr } : w));
    localStorage.setItem(`pulse_fallback_workouts_${userId}`, JSON.stringify(updated));
    showToast('Antrenman günü yerel olarak taşındı.');
  };

  // --- 5. Hafta Değiştirme ve Kopyalama Kontrolleri ---
  const handlePrevWeek = () => {
    const prevMon = new Date(currentWeekMonday);
    prevMon.setDate(prevMon.getDate() - 7);
    setCurrentWeekMonday(prevMon);
  };

  const handleNextWeek = () => {
    const nextMon = new Date(currentWeekMonday);
    nextMon.setDate(nextMon.getDate() + 7);
    setCurrentWeekMonday(nextMon);
  };

  const handleResetToCurrentWeek = () => {
    setCurrentWeekMonday(getMonday(new Date()));
  };

  const handleCopyLastWeekWorkouts = async () => {
    const lastMon = new Date(currentWeekMonday);
    lastMon.setDate(lastMon.getDate() - 7);
    const lastMonStr = getLocalDateString(lastMon);
    const currentMonStr = getLocalDateString(currentWeekMonday);

    setLoading(true);
    let lastWeekWorkouts = workouts.filter((w) => w.week_start === lastMonStr);

    if (lastWeekWorkouts.length === 0) {
      showToast('Geçen haftaya ait antrenman programı bulunamadı.', 'error');
      setLoading(false);
      return;
    }

    const newWorkoutsToInsert = lastWeekWorkouts.map((w) => ({
      user_id: userId,
      day_of_week: w.day_of_week,
      title: w.title,
      description: w.description,
      time_of_day: w.time_of_day,
      is_completed: false,
      week_start: currentMonStr
    }));

    if (!dbFallback) {
      try {
        const { data, error } = await supabase
          .from('workouts')
          .insert(newWorkoutsToInsert)
          .select();

        if (error) throw error;
        setWorkouts((prev) => [...prev, ...data]);
        showToast(`${newWorkoutsToInsert.length} antrenman geçen haftadan kopyalandı.`);
      } catch (err) {
        console.error('Failed to copy to Supabase, using local:', err);
        saveClonedWorkoutsToLocal(newWorkoutsToInsert);
      }
    } else {
      saveClonedWorkoutsToLocal(newWorkoutsToInsert);
    }
    setLoading(false);
  };

  const saveClonedWorkoutsToLocal = (newWorks) => {
    const localNewWorks = newWorks.map((w, idx) => ({
      ...w,
      id: 'local_clone_' + Date.now() + '_' + idx,
      created_at: new Date().toISOString()
    }));
    const updated = [...workouts, ...localNewWorks];
    setWorkouts(updated);
    localStorage.setItem(`pulse_fallback_workouts_${userId}`, JSON.stringify(updated));
    showToast(`${newWorks.length} antrenman yerel olarak kopyalandı.`);
  };

  // --- 6. Kilo & BMI Dinamik Hesaplamaları ---
  
  // Güncel Ağırlık: Kaydedilmiş son kilo kaydı, yoksa varsayılan olarak 98kg
  const currentWeight = useMemo(() => {
    if (weightLogs.length > 0) {
      // Tarihe göre sıralı olduğundan ilk eleman en son eklenendir
      return parseFloat(weightLogs[0].weight);
    }
    return 98.0;
  }, [weightLogs]);

  // Vücut Kitle İndeksi (VKİ - BMI)
  const currentBMI = useMemo(() => {
    const heightInMeters = userHeight / 100;
    const bmiVal = currentWeight / (heightInMeters * heightInMeters);
    return parseFloat(bmiVal.toFixed(1));
  }, [currentWeight, userHeight]);

  const bmiStatus = useMemo(() => {
    if (currentBMI < 18.5) return { text: 'Zayıf', color: '#60A5FA' };
    if (currentBMI < 25) return { text: 'Normal', color: '#10B981' };
    if (currentBMI < 30) return { text: 'Fazla Kilolu', color: '#F59E0B' };
    return { text: 'Obez (Dikkat Edilmeli)', color: '#EF4444' };
  }, [currentBMI]);

  // Egzersiz Süresi Değiştiğinde Ağırlığa Dayalı Kalori Yakım Canlı Hesaplaması
  useEffect(() => {
    if (sportForm.duration) {
      const dur = parseInt(sportForm.duration, 10);
      if (!isNaN(dur) && dur > 0) {
        let met = 5.0; // default MET
        switch (sportForm.type) {
          case 'strength': met = 5.0; break;
          case 'cycling': met = 7.0; break;
          case 'swimming': met = 8.0; break;
          case 'walking': met = 4.0; break;
          case 'yoga': met = 2.5; break;
          default: met = 5.0;
        }
        // Kalori Formülü (Ağırlık bazlı): MET * 3.5 * Kilo / 200 * Süre
        const estCalories = Math.round(met * 3.5 * currentWeight / 200 * dur);
        setSportForm((prev) => ({ ...prev, calories: estCalories.toString() }));
      }
    }
  }, [sportForm.duration, sportForm.type, currentWeight]);

  // --- 7. Veri Ekleme & Silme İşlemleri ---

  // Kilo Kaydı Ekleme
  const handleAddWeight = async (e) => {
    e.preventDefault();
    const wVal = parseFloat(weightInput);
    if (isNaN(wVal) || wVal <= 0) {
      showToast('Lütfen geçerli bir kilo girin.', 'error');
      return;
    }

    const newLog = {
      user_id: userId,
      weight: wVal,
      date: weightDate
    };

    if (!dbFallback) {
      try {
        const { data, error } = await supabase
          .from('weight_logs')
          .insert([newLog])
          .select();

        if (error) throw error;
        setWeightLogs((prev) => [data[0], ...prev]);
        showToast('Kilo kaydı Supabase\'e eklendi.');
      } catch (err) {
        console.error('Weight insert to Supabase failed, using fallback:', err);
        saveWeightToLocal(newLog);
      }
    } else {
      saveWeightToLocal(newLog);
    }
    setWeightInput('');
  };

  const saveWeightToLocal = (newW) => {
    const localW = { ...newW, id: 'local_w_' + Date.now(), created_at: new Date().toISOString() };
    const updated = [localW, ...weightLogs];
    setWeightLogs(updated);
    localStorage.setItem(`pulse_fallback_weight_${userId}`, JSON.stringify(updated));
    showToast('Kilo kaydı tarayıcı hafızasına kaydedildi.');
  };

  // Besin Kalorisi Ekleme
  const handleAddCalorie = async (e) => {
    e.preventDefault();
    const cVal = parseInt(calorieInput, 10);
    if (isNaN(cVal) || cVal <= 0) {
      showToast('Lütfen geçerli bir kalori miktarı girin.', 'error');
      return;
    }

    const newLog = {
      user_id: userId,
      amount: cVal,
      notes: calorieNotes || 'Öğün/Atıştırmalık',
      date: calorieDate
    };

    if (!dbFallback) {
      try {
        const { data, error } = await supabase
          .from('calorie_logs')
          .insert([newLog])
          .select();

        if (error) throw error;
        setCalorieLogs((prev) => [data[0], ...prev]);
        showToast('Kalori alımı kaydedildi.');
      } catch (err) {
        console.error('Calorie insert failed, using fallback:', err);
        saveCalorieToLocal(newLog);
      }
    } else {
      saveCalorieToLocal(newLog);
    }
    setCalorieInput('');
    setCalorieNotes('');
  };

  const saveCalorieToLocal = (newC) => {
    const localC = { ...newC, id: 'local_c_' + Date.now(), created_at: new Date().toISOString() };
    const updated = [localC, ...calorieLogs];
    setCalorieLogs(updated);
    localStorage.setItem(`pulse_fallback_calories_${userId}`, JSON.stringify(updated));
    showToast('Kalori kaydı yerel hafızaya kaydedildi.');
  };

  // Egzersiz Kaydı Ekleme (Ağırlık bazlı MET kalori hesaplı)
  const handleAddSport = async (e) => {
    e.preventDefault();
    if (!sportForm.duration) {
      showToast('Lütfen süre girin.', 'error');
      return;
    }

    const durationInt = parseInt(sportForm.duration, 10);
    const caloriesInt = sportForm.calories ? parseInt(sportForm.calories, 10) : Math.round(durationInt * 7.5);
    const distanceNum = sportForm.distance ? parseFloat(sportForm.distance) : null;

    const newActivity = {
      user_id: userId,
      type: sportForm.type,
      duration: durationInt,
      calories: caloriesInt,
      distance: distanceNum,
      date: sportForm.date,
      notes: sportForm.notes
    };

    if (!dbFallback) {
      try {
        const { data, error } = await supabase
          .from('activities')
          .insert([newActivity])
          .select();

        if (error) throw error;
        setActivities((prev) => [data[0], ...prev]);
        showToast('Egzersiz kaydı eklendi.');
      } catch (err) {
        console.error('Supabase insert failed:', err);
        saveActivityToLocal(newActivity);
      }
    } else {
      saveActivityToLocal(newActivity);
    }

    setSportForm({
      type: 'strength',
      duration: '',
      calories: '',
      distance: '',
      date: getLocalDateString(),
      notes: ''
    });
  };

  // Koşu Kaydı Ekleme (Gelişmiş Formül: Mesafe * Kilo * 1.036 ile tam kalori hesaplar)
  const handleAddRun = async (e) => {
    e.preventDefault();
    if (!runForm.duration || !runForm.distance) {
      showToast('Lütfen mesafe ve süre girin.', 'error');
      return;
    }

    const durationInt = parseInt(runForm.duration, 10);
    const distanceNum = parseFloat(runForm.distance);
    
    // Altın Standart Koşu Kalorisi Formülü: Mesafe (km) * Ağırlık (kg) * 1.036
    const caloriesInt = Math.round(distanceNum * currentWeight * 1.036);

    const newActivity = {
      user_id: userId,
      type: 'running',
      duration: durationInt,
      calories: caloriesInt,
      distance: distanceNum,
      date: runForm.date,
      notes: runForm.notes
    };

    if (!dbFallback) {
      try {
        const { data, error } = await supabase
          .from('activities')
          .insert([newActivity])
          .select();

        if (error) throw error;
        setActivities((prev) => [data[0], ...prev]);
        showToast('Koşu kaydı eklendi.');
      } catch (err) {
        console.error('Supabase insert failed:', err);
        saveActivityToLocal(newActivity);
      }
    } else {
      saveActivityToLocal(newActivity);
    }

    setRunForm({
      duration: '',
      distance: '',
      date: getLocalDateString(),
      notes: ''
    });
  };

  // Su Kaydı Ekleme
  const handleAddWater = async (amount) => {
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast('Geçerli bir miktar girin.', 'error');
      return;
    }

    const newLog = {
      user_id: userId,
      amount: parsedAmount,
      date: getLocalDateString()
    };

    if (!dbFallback) {
      try {
        const { data, error } = await supabase
          .from('water_logs')
          .insert([newLog])
          .select();

        if (error) throw error;
        setWaterLogs((prev) => [data[0], ...prev]);
        showToast(`${parsedAmount}ml su eklendi.`);
      } catch (err) {
        console.error('Supabase water insert failed:', err);
        saveWaterToLocal(newLog);
      }
    } else {
      saveWaterToLocal(newLog);
    }
    setWaterAmount('');
  };

  const handleAddWorkout = async (e) => {
    e.preventDefault();
    if (!workoutForm.title) {
      showToast('Lütfen antrenman adı girin.', 'error');
      return;
    }

    const currentMonStr = getLocalDateString(currentWeekMonday);

    const newWorkout = {
      user_id: userId,
      day_of_week: parseInt(workoutForm.dayOfWeek, 10),
      title: workoutForm.title,
      description: workoutForm.description,
      time_of_day: workoutForm.timeOfDay,
      is_completed: false,
      week_start: currentMonStr
    };

    if (!dbFallback) {
      try {
        const { data, error } = await supabase
          .from('workouts')
          .insert([newWorkout])
          .select();

        if (error) throw error;
        setWorkouts((prev) => [...prev, data[0]]);
        showToast('Antrenman takvime eklendi.');
      } catch (err) {
        console.error('Supabase workout insert failed:', err);
        saveWorkoutToLocal(newWorkout);
      }
    } else {
      saveWorkoutToLocal(newWorkout);
    }

    setIsWorkoutModalOpen(false);
    setWorkoutForm({
      dayOfWeek: 1,
      title: '',
      description: '',
      timeOfDay: '08:00'
    });
  };

  // --- 8. İstatistik & Dashboard Hesaplamaları ---

  const weekDaysList = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekMonday);
      d.setDate(currentWeekMonday.getDate() + i);
      days.push(getLocalDateString(d));
    }
    return days;
  }, [currentWeekMonday]);

  const todayDateString = useMemo(() => getLocalDateString(), []);

  const weekRangeLabel = useMemo(() => {
    const start = new Date(currentWeekMonday);
    const end = new Date(currentWeekMonday);
    end.setDate(end.getDate() + 6);
    const options = { day: 'numeric', month: 'long' };
    return `${start.toLocaleDateString('tr-TR', options)} - ${end.toLocaleDateString('tr-TR', options)} ${end.getFullYear()}`;
  }, [currentWeekMonday]);

  const currentWeekWorkouts = useMemo(() => {
    const monStr = getLocalDateString(currentWeekMonday);
    return workouts.filter((w) => w.week_start === monStr);
  }, [workouts, currentWeekMonday]);

  // Su Hesaplama (Bugün)
  const todayWater = useMemo(() => {
    return waterLogs
      .filter((log) => log.date === todayDateString)
      .reduce((sum, log) => sum + log.amount, 0);
  }, [waterLogs, todayDateString]);

  // Kalori Hesaplamaları (Bugün)
  const todayCalorieIntake = useMemo(() => {
    return calorieLogs
      .filter((log) => log.date === todayDateString)
      .reduce((sum, log) => sum + log.amount, 0);
  }, [calorieLogs, todayDateString]);

  const todayCalorieBurned = useMemo(() => {
    return activities
      .filter((act) => act.date === todayDateString)
      .reduce((sum, act) => sum + act.calories, 0);
  }, [activities, todayDateString]);

  // Trend Grafiği Verileri (Seçilen Hafta)
  const weeklySportChartData = useMemo(() => {
    return weekDaysList.map((dateStr) => {
      const totalDuration = activities
        .filter((act) => act.date === dateStr)
        .reduce((sum, act) => sum + act.duration, 0);

      const d = new Date(dateStr);
      const label = d.toLocaleDateString('tr-TR', { weekday: 'short' });
      return { Gün: label, Süre: totalDuration };
    });
  }, [activities, weekDaysList]);

  const weeklyWaterChartData = useMemo(() => {
    return weekDaysList.map((dateStr) => {
      const totalAmount = waterLogs
        .filter((log) => log.date === dateStr)
        .reduce((sum, log) => sum + log.amount, 0);

      const d = new Date(dateStr);
      const label = d.toLocaleDateString('tr-TR', { weekday: 'short' });
      return { Gün: label, Miktar: totalAmount };
    });
  }, [waterLogs, weekDaysList]);

  // Kalori Alım vs Yakım Çift Bar Grafik Verisi
  const weeklyCalorieChartData = useMemo(() => {
    return weekDaysList.map((dateStr) => {
      const intake = calorieLogs
        .filter((log) => log.date === dateStr)
        .reduce((sum, log) => sum + log.amount, 0);

      const burned = activities
        .filter((act) => act.date === dateStr)
        .reduce((sum, act) => sum + act.calories, 0);

      const d = new Date(dateStr);
      const label = d.toLocaleDateString('tr-TR', { weekday: 'short' });
      return { Gün: label, Alınan: intake, Yakılan: burned };
    });
  }, [calorieLogs, activities, weekDaysList]);

  // Kilo Trend Grafik Verisi (Kronolojik)
  const weightTrendChartData = useMemo(() => {
    // Grafikte göstermek için tersine çeviriyoruz (en eskiden en yeniye)
    return [...weightLogs]
      .reverse()
      .slice(-10) // Son 10 kaydı göster
      .map((log) => {
        const d = new Date(log.date);
        return {
          Tarih: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
          Kilo: parseFloat(log.weight)
        };
      });
  }, [weightLogs]);

  const weeklyTotalActiveMinutes = useMemo(() => {
    return activities
      .filter((act) => weekDaysList.includes(act.date))
      .reduce((sum, act) => sum + act.duration, 0);
  }, [activities, weekDaysList]);

  const weeklyTotalRunningDistance = useMemo(() => {
    return activities
      .filter((act) => act.type === 'running' && weekDaysList.includes(act.date))
      .reduce((sum, act) => sum + (act.distance ? parseFloat(act.distance) : 0), 0);
  }, [activities, weekDaysList]);

  const calendarDays = [
    { num: 1, name: 'Pazartesi' },
    { num: 2, name: 'Salı' },
    { num: 3, name: 'Çarşamba' },
    { num: 4, name: 'Perşembe' },
    { num: 5, name: 'Cuma' },
    { num: 6, name: 'Cumartesi' },
    { num: 0, name: 'Pazar' }
  ];

  const currentDayOfWeekNum = useMemo(() => {
    return new Date().getDay();
  }, []);

  const todayWorkouts = useMemo(() => {
    return currentWeekWorkouts.filter((w) => w.day_of_week === currentDayOfWeekNum);
  }, [currentWeekWorkouts, currentDayOfWeekNum]);

  const completedTodayCount = useMemo(() => {
    return todayWorkouts.filter((w) => w.is_completed).length;
  }, [todayWorkouts]);

  const calendarDaysWithDates = useMemo(() => {
    return calendarDays.map((day, index) => {
      const d = new Date(currentWeekMonday);
      d.setDate(currentWeekMonday.getDate() + index);
      const dateLabel = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
      const isToday = getLocalDateString(d) === todayDateString;
      return {
        ...day,
        dateLabel,
        isToday
      };
    });
  }, [currentWeekMonday, todayDateString]);

  // --- 9. Ayar Güncellemeleri ---
  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('pulse_height', userHeight.toString());
    localStorage.setItem('pulse_water_goal', dailyWaterGoal.toString());
    localStorage.setItem('pulse_running_goal', dailyRunningGoal.toString());
    showToast('Ayarlar kaydedildi.');
  };

  const livePace = useMemo(() => {
    if (!runForm.duration || !runForm.distance) return null;
    const dur = parseFloat(runForm.duration);
    const dist = parseFloat(runForm.distance);
    if (dist <= 0) return null;
    
    const paceDecimal = dur / dist;
    const paceMins = Math.floor(paceDecimal);
    const paceSecs = Math.round((paceDecimal - paceMins) * 60);
    return `${paceMins}:${paceSecs < 10 ? '0' + paceSecs : paceSecs} dk/km`;
  }, [runForm.duration, runForm.distance]);

  return (
    <div className="app-container">
      {/* Toast Bildirimleri */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* 1. Kenar Çubuğu (Masaüstü) */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-pulse"></div>
          <h1 className="logo-text">PULSE</h1>
        </div>

        <nav style={{ flex: 1 }}>
          <ul className="nav-links">
            <li className="nav-item">
              <button
                className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => { setActiveTab('dashboard'); fetchAllData(); }}
              >
                <Compass /> Dashboard
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-button ${activeTab === 'sports' ? 'active' : ''}`}
                onClick={() => setActiveTab('sports')}
              >
                <Activity /> Spor Takibi
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-button ${activeTab === 'water' ? 'active' : ''}`}
                onClick={() => setActiveTab('water')}
              >
                <Droplet /> Su Takibi
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-button ${activeTab === 'running' ? 'active' : ''}`}
                onClick={() => setActiveTab('running')}
              >
                <Flame /> Koşu Takibi
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-button ${activeTab === 'kiloCalorie' ? 'active' : ''}`}
                onClick={() => setActiveTab('kiloCalorie')}
              >
                <TrendingUp /> Kilo & Kalori
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-button ${activeTab === 'calendar' ? 'active' : ''}`}
                onClick={() => setActiveTab('calendar')}
              >
                <Calendar /> Takvim
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-button ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <Settings /> Ayarlar
              </button>
            </li>
          </ul>
        </nav>

        {/* Profil Kartı (Hakan) */}
        <div className="profile-badge">
          <div className="profile-avatar">H</div>
          <div className="profile-details">
            <span className="profile-name">Hakan</span>
            <span className="profile-id">{currentWeight.toFixed(1)} kg | VKİ {currentBMI}</span>
          </div>
        </div>
      </aside>

      {/* 2. Alt Menü (Mobil) */}
      <nav className="bottom-nav">
        <button
          className={`mobile-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <Compass />
          <span>Dashboard</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeTab === 'sports' ? 'active' : ''}`}
          onClick={() => setActiveTab('sports')}
        >
          <Activity />
          <span>Spor</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeTab === 'kiloCalorie' ? 'active' : ''}`}
          onClick={() => setActiveTab('kiloCalorie')}
        >
          <TrendingUp />
          <span>Diyet</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <Calendar />
          <span>Takvim</span>
        </button>
      </nav>

      {/* 3. Ana İçerik Alanı */}
      <main className="main-content">
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Hoş geldin, Hakan
            </span>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
              {activeTab === 'dashboard' && 'Haftalık Performans Paneli'}
              {activeTab === 'sports' && 'Egzersiz Günlüğü'}
              {activeTab === 'water' && 'Su Takip İstasyonu'}
              {activeTab === 'running' && 'Koşu Kayıtları'}
              {activeTab === 'kiloCalorie' && 'Kilo & Kalori Yönetim Paneli'}
              {activeTab === 'calendar' && 'Haftalık Antrenman Takvimi'}
              {activeTab === 'settings' && 'Ayarlar'}
            </h2>
          </div>
          <div className="flex-center" style={{ gap: '1rem' }}>
            {dbFallback && (
              <span className="glass-card" style={{ padding: '0.4rem 0.65rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)', color: '#EF4444', borderRadius: '6px', fontWeight: 600 }}>
                <Info size={12} /> Çevrimdışı Mod
              </span>
            )}
          </div>
        </div>

        {/* Global Hafta Navigasyon Barı */}
        {(activeTab === 'calendar' || activeTab === 'dashboard' || activeTab === 'kiloCalorie') && (
          <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={handlePrevWeek} style={{ padding: '0.4rem 0.6rem' }} title="Önceki Hafta">
                <ChevronLeft size={16} />
              </button>
              <button className="btn btn-secondary" onClick={handleResetToCurrentWeek} style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: 600 }}>
                Bu Hafta
              </button>
              <button className="btn btn-secondary" onClick={handleNextWeek} style={{ padding: '0.4rem 0.6rem' }} title="Sonraki Hafta">
                <ChevronRight size={16} />
              </button>
            </div>
            <strong style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {weekRangeLabel}
            </strong>
            {activeTab === 'calendar' && (
              <button className="btn btn-secondary text-accent-green" onClick={handleCopyLastWeekWorkouts} style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', gap: '0.35rem' }}>
                <Copy size={14} /> Geçen Haftadan Kopyala
              </button>
            )}
            {activeTab === 'kiloCalorie' && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Boy: <strong>{userHeight} cm</strong></span>
            )}
          </div>
        )}

        {/* --- TABS --- */}

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="dashboard-grid">
              <div className="glass-card stat-card">
                <div className="icon-container">
                  <Activity size={18} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Haftalık Egzersiz</span>
                  <span className="stat-value">{weeklyTotalActiveMinutes} dk</span>
                  <span className="stat-sub">Seçili haftanın toplamı</span>
                </div>
              </div>

              <div className="glass-card stat-card">
                <div className="icon-container">
                  <Droplet size={18} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Bugünkü Su</span>
                  <span className="stat-value">{todayWater} / {dailyWaterGoal} ml</span>
                  <span className="stat-sub">Hedef: {dailyWaterGoal} ml</span>
                </div>
              </div>

              <div className="glass-card stat-card">
                <div className="icon-container">
                  <User size={18} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Ağırlık & BMI</span>
                  <span className="stat-value">{currentWeight.toFixed(1)} kg</span>
                  <span className="stat-sub" style={{ color: bmiStatus.color, fontWeight: 600 }}>VKİ: {currentBMI} ({bmiStatus.text})</span>
                </div>
              </div>

              <div className="glass-card stat-card">
                <div className="icon-container">
                  <Flame size={18} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Bugünkü Net Kalori</span>
                  <span className="stat-value">{todayCalorieIntake - todayCalorieBurned} kcal</span>
                  <span className="stat-sub">Alınan: {todayCalorieIntake} | Yakılan: {todayCalorieBurned}</span>
                </div>
              </div>
            </div>

            <div className="dashboard-grid" style={{ marginTop: '1.25rem' }}>
              <div className="glass-card chart-card">
                <div className="chart-header">
                  <span className="chart-title"><TrendingUp size={16} /> Egzersiz Süresi (dk)</span>
                </div>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={weeklySportChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="Gün" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '6px' }}
                      />
                      <Bar dataKey="Süre" fill="var(--accent-color)" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card chart-card">
                <div className="chart-header">
                  <span className="chart-title"><Droplet size={16} /> Su Tüketimi (ml)</span>
                </div>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <AreaChart data={weeklyWaterChartData}>
                      <defs>
                        <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="Gün" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '6px' }}
                      />
                      <Area type="monotone" dataKey="Miktar" stroke="var(--accent-color)" strokeWidth={1.5} fillOpacity={1} fill="url(#colorWater)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass-card chart-card">
                <div className="chart-header">
                  <span className="chart-title"><TrendingUp size={16} /> Kilo Değişim Trendi (kg)</span>
                </div>
                <div style={{ width: '100%', height: 220 }}>
                  {weightTrendChartData.length === 0 ? (
                    <div className="empty-state" style={{ height: 180 }}>
                      <TrendingUp size={24} />
                      <span className="empty-title">Kilo Kaydı Bulunmuyor</span>
                      <button className="btn btn-secondary" onClick={() => setActiveTab('kiloCalorie')} style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', marginTop: '0.5rem' }}>
                        Kilo Ekle
                      </button>
                    </div>
                  ) : (
                    <ResponsiveContainer>
                      <LineChart data={weightTrendChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="Tarih" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                        <YAxis domain={['auto', 'auto']} stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '6px' }}
                        />
                        <Line type="monotone" dataKey="Kilo" stroke="var(--accent-color)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Son Aktiviteler */}
            <div className="glass-card" style={{ marginTop: '1.25rem' }}>
              <div className="log-header">
                <span className="log-title">Son Aktiviteler</span>
                <button className="btn btn-secondary" onClick={() => setActiveTab('sports')} style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}>
                  Tümü
                </button>
              </div>
              {activities.length === 0 ? (
                <div className="empty-state">
                  <Activity size={24} />
                  <span className="empty-title">Kayıt Bulunmamaktadır</span>
                </div>
              ) : (
                <div className="log-list" style={{ maxHeight: '200px' }}>
                  {activities.slice(0, 3).map((act) => (
                    <div key={act.id} className="log-item">
                      <div className="log-details">
                        <div className="icon-container" style={{ width: '32px', height: '32px' }}>
                          {act.type === 'running' ? <Flame size={14} /> : <Activity size={14} />}
                        </div>
                        <div className="log-meta">
                          <span className="log-name">
                            {act.type === 'running' && 'Koşu'}
                            {act.type === 'strength' && 'Ağırlık & Kuvvet'}
                            {act.type === 'cycling' && 'Bisiklet'}
                            {act.type === 'swimming' && 'Yüzme'}
                            {act.type === 'walking' && 'Yürüyüş'}
                            {act.type === 'yoga' && 'Yoga & Pilates'}
                            {act.type === 'other' && 'Diğer Spor'}
                          </span>
                          <span className="log-time">{new Date(act.date).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                      <div className="log-stats">
                        <div className="log-stat">
                          <span className="log-stat-val">{act.duration} dk</span>
                          <span className="log-stat-lbl">Süre</span>
                        </div>
                        {act.distance && (
                          <div className="log-stat">
                            <span className="log-stat-val">{parseFloat(act.distance).toFixed(1)} km</span>
                            <span className="log-stat-lbl">Mesafe</span>
                          </div>
                        )}
                        <div className="log-stat">
                          <span className="log-stat-val">{act.calories} kcal</span>
                          <span className="log-stat-lbl">Kalori</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: GENERAL SPORTS TRACKER */}
        {activeTab === 'sports' && (
          <div className="feature-view-grid">
            <div className="glass-card" style={{ height: 'fit-content' }}>
              <h3 className="form-title"><Plus size={16} /> Egzersiz Ekle</h3>
              <form onSubmit={handleAddSport}>
                <div className="form-group">
                  <label>Aktivite Türü</label>
                  <select
                    value={sportForm.type}
                    onChange={(e) => setSportForm({ ...sportForm, type: e.target.value })}
                  >
                    <option value="strength">Kuvvet / Ağırlık</option>
                    <option value="cycling">Bisiklet</option>
                    <option value="swimming">Yüzme</option>
                    <option value="walking">Yürüyüş</option>
                    <option value="yoga">Yoga / Pilates</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Süre (dk)</label>
                    <input
                      type="number"
                      placeholder="45"
                      value={sportForm.duration}
                      onChange={(e) => setSportForm({ ...sportForm, duration: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Yakılan Kalori (kcal - Otomatik)</label>
                    <input
                      type="number"
                      placeholder="Kilonuza göre hesaplanır"
                      value={sportForm.calories}
                      onChange={(e) => setSportForm({ ...sportForm, calories: e.target.value })}
                    />
                  </div>
                </div>

                {sportForm.type === 'cycling' || sportForm.type === 'walking' ? (
                  <div className="form-group">
                    <label>Mesafe (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="10"
                      value={sportForm.distance}
                      onChange={(e) => setSportForm({ ...sportForm, distance: e.target.value })}
                    />
                  </div>
                ) : null}

                <div className="form-group">
                  <label>Tarih</label>
                  <input
                    type="date"
                    value={sportForm.date}
                    onChange={(e) => setSportForm({ ...sportForm, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Notlar</label>
                  <textarea
                    placeholder="Egzersiz notları..."
                    value={sportForm.notes}
                    onChange={(e) => setSportForm({ ...sportForm, notes: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.25rem' }}>
                  Kaydet
                </button>
              </form>
            </div>

            <div className="glass-card">
              <div className="log-header">
                <span className="log-title">Aktivite Günlüğü ({activities.length})</span>
              </div>

              {activities.length === 0 ? (
                <div className="empty-state">
                  <Activity size={24} />
                  <span className="empty-title">Aktivite Kaydı Yok</span>
                </div>
              ) : (
                <div className="log-list">
                  {activities.map((act) => (
                    <div key={act.id} className="log-item">
                      <div className="log-details">
                        <div className="icon-container" style={{ width: '36px', height: '36px' }}>
                          {act.type === 'running' ? <Flame size={16} /> : <Activity size={16} />}
                        </div>
                        <div className="log-meta">
                          <span className="log-name">
                            {act.type === 'running' && 'Koşu'}
                            {act.type === 'strength' && 'Ağırlık & Kuvvet'}
                            {act.type === 'cycling' && 'Bisiklet'}
                            {act.type === 'swimming' && 'Yüzme'}
                            {act.type === 'walking' && 'Yürüyüş'}
                            {act.type === 'yoga' && 'Yoga & Pilates'}
                            {act.type === 'other' && 'Diğer Spor'}
                          </span>
                          <span className="log-time">
                            {new Date(act.date).toLocaleDateString('tr-TR')}
                            {act.notes && ` • "${act.notes}"`}
                          </span>
                        </div>
                      </div>
                      <div className="log-stats">
                        <div className="log-stat">
                          <span className="log-stat-val">{act.duration} dk</span>
                          <span className="log-stat-lbl">Süre</span>
                        </div>
                        {act.distance && (
                          <div className="log-stat">
                            <span className="log-stat-val">{parseFloat(act.distance).toFixed(1)} km</span>
                            <span className="log-stat-lbl">Mesafe</span>
                          </div>
                        )}
                        <div className="log-stat">
                          <span className="log-stat-val">{act.calories} kcal</span>
                          <span className="log-stat-lbl">Kalori</span>
                        </div>
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteItem('activities', act.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: WATER TRACKER */}
        {activeTab === 'water' && (
          <div className="feature-view-grid">
            <div className="glass-card" style={{ height: 'fit-content' }}>
              <h3 className="form-title"><Droplet size={16} /> Su Girişi</h3>

              <div className="water-container">
                <div className="water-visual">
                  <div className="water-percentage">
                    %{Math.min(100, Math.round((todayWater / dailyWaterGoal) * 100))}
                  </div>
                  <div
                    className="water-liquid"
                    style={{ height: `${Math.min(100, (todayWater / dailyWaterGoal) * 100)}%` }}
                  ></div>
                </div>

                <div className="water-stat-row">
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Tüketilen</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-color)' }}>{todayWater} ml</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Hedef</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{dailyWaterGoal} ml</span>
                  </div>
                </div>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="quick-add-grid">
                    <button className="btn btn-secondary" onClick={() => handleAddWater(250)} style={{ padding: '0.5rem 0.25rem', fontSize: '0.8rem' }}>
                      +250 ml
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleAddWater(500)} style={{ padding: '0.5rem 0.25rem', fontSize: '0.8rem' }}>
                      +500 ml
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleAddWater(750)} style={{ padding: '0.5rem 0.25rem', fontSize: '0.8rem' }}>
                      +750 ml
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                    <input
                      type="number"
                      placeholder="Miktar (ml)"
                      value={waterAmount}
                      onChange={(e) => setWaterAmount(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={() => handleAddWater(waterAmount)}>
                      Ekle
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card">
              <div className="log-header">
                <span className="log-title">Su Tüketim Kayıtları</span>
              </div>

              {waterLogs.length === 0 ? (
                <div className="empty-state">
                  <Droplet size={24} />
                  <span className="empty-title">Kayıt Yok</span>
                </div>
              ) : (
                <div className="log-list">
                  {waterLogs.map((log) => (
                    <div key={log.id} className="log-item">
                      <div className="log-details">
                        <div className="icon-container" style={{ width: '32px', height: '32px' }}>
                          <Droplet size={14} />
                        </div>
                        <div className="log-meta">
                          <span className="log-name">{log.amount} ml</span>
                          <span className="log-time">{new Date(log.date).toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                      <div className="log-stats">
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteItem('water_logs', log.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: RUNNING LOGGER */}
        {activeTab === 'running' && (
          <div className="feature-view-grid">
            <div className="glass-card" style={{ height: 'fit-content' }}>
              <h3 className="form-title"><Flame size={16} /> Koşu Kaydı</h3>
              <form onSubmit={handleAddRun}>
                <div className="form-group">
                  <label>Mesafe (km)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="5.0"
                    value={runForm.distance}
                    onChange={(e) => setRunForm({ ...runForm, distance: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Süre (dk)</label>
                  <input
                    type="number"
                    placeholder="30"
                    value={runForm.duration}
                    onChange={(e) => setRunForm({ ...runForm, duration: e.target.value })}
                    required
                  />
                </div>

                {livePace && (
                  <div className="glass-card" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem 0.85rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Hesaplanan Tempo:</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-color)' }}>{livePace}</span>
                  </div>
                )}

                <div className="form-group">
                  <label>Tarih</label>
                  <input
                    type="date"
                    value={runForm.date}
                    onChange={(e) => setRunForm({ ...runForm, date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Notlar</label>
                  <textarea
                    placeholder="Hava, tempo notları..."
                    value={runForm.notes}
                    onChange={(e) => setRunForm({ ...runForm, notes: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.25rem' }}>
                  Koşuyu Kaydet
                </button>
              </form>
            </div>

            <div className="glass-card">
              <div className="log-header">
                <span className="log-title">Koşu Günlüğü</span>
              </div>

              {activities.filter((act) => act.type === 'running').length === 0 ? (
                <div className="empty-state">
                  <Flame size={24} />
                  <span className="empty-title">Koşu Kaydı Yok</span>
                </div>
              ) : (
                <div className="log-list">
                  {activities
                    .filter((act) => act.type === 'running')
                    .map((act) => {
                      let paceFormatted = 'N/A';
                      if (act.duration && act.distance) {
                        const paceDecimal = act.duration / parseFloat(act.distance);
                        const mins = Math.floor(paceDecimal);
                        const secs = Math.round((paceDecimal - mins) * 60);
                        paceFormatted = `${mins}:${secs < 10 ? '0' + secs : secs} /km`;
                      }
                      return (
                        <div key={act.id} className="log-item">
                          <div className="log-details">
                            <div className="icon-container" style={{ width: '36px', height: '36px' }}>
                              <Flame size={16} />
                            </div>
                            <div className="log-meta">
                              <span className="log-name">{parseFloat(act.distance).toFixed(2)} km</span>
                              <span className="log-time">
                                {new Date(act.date).toLocaleDateString('tr-TR')}
                                {act.notes && ` • "${act.notes}"`}
                              </span>
                            </div>
                          </div>
                          <div className="log-stats">
                            <div className="log-stat">
                              <span className="log-stat-val">{act.duration} dk</span>
                              <span className="log-stat-lbl">Süre</span>
                            </div>
                            <div className="log-stat">
                              <span className="log-stat-val">{paceFormatted}</span>
                              <span className="log-stat-lbl">Tempo</span>
                            </div>
                            <div className="log-stat">
                              <span className="log-stat-val">{act.calories} kcal</span>
                              <span className="log-stat-lbl">Kalori</span>
                            </div>
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteItem('activities', act.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* YENİ TAB: KİLO & KALORİ (DİYET) YÖNETİMİ */}
        {activeTab === 'kiloCalorie' && (
          <div className="feature-view-grid">
            {/* Sol Sütun: Kayıt Formları & BMI Özeti */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* BMI & Profil Özeti */}
              <div className="glass-card">
                <h3 className="form-title" style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', color: 'var(--accent-color)' }}><User size={16} /> Vücut Analizi (Hakan)</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '1rem 0' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mevcut Kilo:</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{currentWeight.toFixed(1)} kg</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Vücut Kitle İndeksi:</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: bmiStatus.color }}>{currentBMI}</div>
                  </div>
                </div>

                <div style={{ margin: '0.5rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    <span>Durum:</span>
                    <span style={{ color: bmiStatus.color, fontWeight: 700 }}>{bmiStatus.text}</span>
                  </div>
                  {/* BMI Progress bar */}
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: '18.5%', background: '#60A5FA' }} title="Zayıf (<18.5)"></div>
                    <div style={{ width: '6.5%', background: '#10B981' }} title="Normal (18.5-25)"></div>
                    <div style={{ width: '5.0%', background: '#F59E0B' }} title="Kilolu (25-30)"></div>
                    <div style={{ width: '70.0%', background: '#EF4444' }} title="Obez (>=30)"></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    <span>18.5</span>
                    <span>25</span>
                    <span>30</span>
                    <span>40+</span>
                  </div>
                </div>
              </div>

              {/* Kilo Kayıt Formu */}
              <div className="glass-card">
                <h3 className="form-title"><Plus size={16} /> Yeni Kilo Kaydı</h3>
                <form onSubmit={handleAddWeight}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Kilo (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Örn: 98.0"
                        value={weightInput}
                        onChange={(e) => setWeightInput(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Tarih</label>
                      <input
                        type="date"
                        value={weightDate}
                        onChange={(e) => setWeightDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.25rem' }}>
                    Kilo Kaydet
                  </button>
                </form>
              </div>

              {/* Kalori Alımı Kayıt Formu */}
              <div className="glass-card">
                <h3 className="form-title"><Plus size={16} /> Öğün Kalorisi Kaydet</h3>
                <form onSubmit={handleAddCalorie}>
                  <div className="form-group">
                    <label>Kalori (kcal)</label>
                    <input
                      type="number"
                      placeholder="Örn: 500"
                      value={calorieInput}
                      onChange={(e) => setCalorieInput(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Açıklama / Öğün</label>
                      <input
                        type="text"
                        placeholder="Örn: Öğle Yemeği, Kahve vb."
                        value={calorieNotes}
                        onChange={(e) => setCalorieNotes(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Tarih</label>
                      <input
                        type="date"
                        value={calorieDate}
                        onChange={(e) => setCalorieDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.25rem' }}>
                    Kalori Kaydet
                  </button>
                </form>
              </div>

            </div>

            {/* Sağ Sütun: Kayıt Geçmişleri & Trend Grafikleri */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Grafik Paneli (Çiftli Grafik) */}
              <div className="glass-card">
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                  Haftalık Enerji Dengesi (Alınan vs Yakılan kcal)
                </h4>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <BarChart data={weeklyCalorieChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="Gün" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '6px' }}
                      />
                      <Bar dataKey="Alınan" fill="var(--text-muted)" radius={[4, 4, 0, 0]} maxBarSize={15} />
                      <Bar dataKey="Yakılan" fill="var(--accent-color)" radius={[4, 4, 0, 0]} maxBarSize={15} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Kilo Değişim Grafiği */}
              {weightTrendChartData.length > 0 && (
                <div className="glass-card">
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                    Ağırlık Değişim Trendi (Kilo)
                  </h4>
                  <div style={{ width: '100%', height: 160 }}>
                    <ResponsiveContainer>
                      <LineChart data={weightTrendChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="Tarih" stroke="var(--text-secondary)" fontSize={9} tickLine={false} />
                        <YAxis domain={['auto', 'auto']} stroke="var(--text-secondary)" fontSize={9} tickLine={false} />
                        <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: '6px' }} />
                        <Line type="monotone" dataKey="Kilo" stroke="var(--accent-color)" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Kilo ve Kalori Geçmiş Listeleri */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                
                {/* Kilo Günlüğü */}
                <div className="glass-card" style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.25rem' }}>Kilo Günlüğü</span>
                  <div className="log-list" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {weightLogs.map((log) => (
                      <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px', marginBottom: '0.35rem', fontSize: '0.75rem' }}>
                        <div>
                          <strong>{parseFloat(log.weight).toFixed(1)} kg</strong>
                          <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.65rem' }}>{new Date(log.date).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <button className="delete-btn" onClick={() => handleDeleteItem('weight_logs', log.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kalori Günlüğü */}
                <div className="glass-card" style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.25rem' }}>Öğün Günlüğü</span>
                  <div className="log-list" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                    {calorieLogs.map((log) => (
                      <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px', marginBottom: '0.35rem', fontSize: '0.75rem' }}>
                        <div>
                          <strong>{log.amount} kcal</strong>
                          <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.65rem' }}>{log.notes} • {new Date(log.date).toLocaleDateString('tr-TR')}</span>
                        </div>
                        <button className="delete-btn" onClick={() => handleDeleteItem('calorie_logs', log.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 5: WEEKLY CALENDAR FULL WIDTH GRID & MOVING-DRAG-AND-DROP */}
        {activeTab === 'calendar' && (
          <div className="calendar-layout">
            <div className="calendar-view-grid">
              <div className="days-grid">
                {calendarDaysWithDates.map((day) => {
                  const dayWorkouts = currentWeekWorkouts.filter((w) => w.day_of_week === day.num);
                  return (
                    <div
                      key={day.num}
                      className={`day-card ${day.isToday ? 'today' : ''} ${draggedOverDay === day.num ? 'drag-over' : ''}`}
                      onDragOver={(e) => handleDragOver(e, day.num)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, day.num)}
                    >
                      <div className="day-header">
                        <span className={`day-name ${day.isToday ? 'today-label' : ''}`}>{day.name}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{day.dateLabel}</span>
                      </div>

                      <div className="day-workouts">
                        {dayWorkouts.length === 0 ? (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: '3.5rem', fontStyle: 'italic' }}>
                            Boş
                          </div>
                        ) : (
                          dayWorkouts.map((w) => (
                            <div
                              key={w.id}
                              className={`workout-item ${w.is_completed ? 'completed' : ''}`}
                              draggable="true"
                              onDragStart={(e) => handleDragStart(e, w.id)}
                            >
                              <span className="workout-time">{w.time_of_day}</span>
                              <span className="workout-title" style={{ textDecoration: w.is_completed ? 'line-through' : 'none', opacity: w.is_completed ? 0.5 : 1 }}>{w.title}</span>
                              {w.description && <p className="workout-desc">{w.description}</p>}
                              
                              <div className="workout-actions">
                                <div
                                  className="workout-checkbox-container"
                                  onClick={() => handleToggleWorkout(w.id, w.is_completed)}
                                >
                                  <div className={`workout-checkbox ${w.is_completed ? 'checked' : ''}`}>
                                    {w.is_completed && <Check size={8} strokeWidth={3} />}
                                  </div>
                                  <span style={{ fontSize: '0.65rem' }}>{w.is_completed ? 'Tamam' : 'Yap'}</span>
                                </div>
                                <button
                                  className="delete-btn"
                                  onClick={() => handleDeleteItem('workouts', w.id)}
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <button
                        className="day-add-btn"
                        onClick={() => {
                          setWorkoutForm({ ...workoutForm, dayOfWeek: day.num, title: '', description: '', timeOfDay: '08:00' });
                          setIsWorkoutModalOpen(true);
                        }}
                      >
                        <Plus size={10} /> Ekle
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Antrenman Ekleme Modalı */}
            {isWorkoutModalOpen && (
              <div className="modal-overlay" onClick={() => setIsWorkoutModalOpen(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3 className="form-title" style={{ marginBottom: '1rem' }}>
                    <Calendar size={16} /> Antrenman Programla
                  </h3>
                  <form onSubmit={handleAddWorkout}>
                    <div className="form-group">
                      <label>Gün</label>
                      <select
                        value={workoutForm.dayOfWeek}
                        onChange={(e) => setWorkoutForm({ ...workoutForm, dayOfWeek: parseInt(e.target.value, 10) })}
                      >
                        <option value="1">Pazartesi</option>
                        <option value="2">Salı</option>
                        <option value="3">Çarşamba</option>
                        <option value="4">Perşembe</option>
                        <option value="5">Cuma</option>
                        <option value="6">Cumartesi</option>
                        <option value="0">Pazar</option>
                      </select>
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label>Başlık</label>
                        <input
                          type="text"
                          placeholder="Örn: Göğüs Egzersizleri"
                          value={workoutForm.title}
                          onChange={(e) => setWorkoutForm({ ...workoutForm, title: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Saat</label>
                        <input
                          type="time"
                          value={workoutForm.timeOfDay}
                          onChange={(e) => setWorkoutForm({ ...workoutForm, timeOfDay: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Detaylar / Egzersizler</label>
                      <textarea
                        placeholder="Egzersiz listesi..."
                        value={workoutForm.description}
                        onChange={(e) => setWorkoutForm({ ...workoutForm, description: e.target.value })}
                      />
                    </div>

                    <div className="modal-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setIsWorkoutModalOpen(false)}
                      >
                        İptal
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Ekle
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="glass-card">
              <h3 className="form-title" style={{ color: 'var(--text-main)' }}><User size={16} /> Hedefleri Düzenle</h3>
              <form onSubmit={handleSaveSettings}>
                <div style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-glass)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Aktif Profil:</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>Hakan</strong>
                </div>

                <div className="form-group">
                  <label>Boy Uzunluğu (cm)</label>
                  <input
                    type="number"
                    value={userHeight}
                    onChange={(e) => setUserHeight(parseInt(e.target.value, 10))}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>VKİ (Vücut Kitle İndeksi) hesaplamak için kullanılır.</small>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Günlük Su Hedefi (ml)</label>
                    <input
                      type="number"
                      step="50"
                      value={dailyWaterGoal}
                      onChange={(e) => setDailyWaterGoal(parseInt(e.target.value, 10))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Haftalık Koşu Hedefi (km)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={dailyRunningGoal}
                      onChange={(e) => setDailyRunningGoal(parseFloat(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  Kaydet
                </button>
              </form>
            </div>

            {/* Supabase SQL Bilgilendirme Kutusu */}
            <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.01)' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 700 }}>
                <Sparkles size={14} className="text-accent-red" /> Supabase SQL Talimatları
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                Verileriniz <strong>Hakan</strong> profiliyle Supabase veritabanında saklanır. Tabloları kurmak için projenin kök dizinindeki <code>supabase_schema.sql</code> kodlarını kopyalayıp Supabase SQL Editöründe çalıştırın.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
