import React, { useState, useEffect, useMemo } from 'react';
import { db, storage } from './services/firebase'; 
import { collection, addDoc, onSnapshot, doc, updateDoc, arrayUnion, increment, deleteDoc, setDoc, arrayRemove, writeBatch, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// @ts-ignore
import heic2any from 'heic2any';

import { User, UserRole, Tour, Photo, Comment, PhotoCategory } from './types';
import { ChatWidget } from './components/ChatWidget'; 
import { generatePhotoCaption } from './services/geminiService';
import { 
  Globe, Upload, LogOut, Plus, Edit3, Trash2, 
  User as UserIcon, LogIn, X, Camera, MapPin, 
  Users, Save, Filter, LayoutGrid, Calendar, MessageSquare, Heart, Send, Share2, Tag, Image as ImageIcon, Check, Download, RefreshCcw, Lock, ChevronDown, Settings, Search, UserPlus, UserMinus,
  CheckSquare, Square, CalendarDays, MoreHorizontal, PenLine, AlertCircle, Loader2, LayoutTemplate, Crown, Flame, KeyRound, Cog
} from 'lucide-react';

// --- Constants & Translations ---

const PHOTO_CATEGORIES: {value: PhotoCategory, label: string, icon: any}[] = [
  { value: 'scenery', label: '风景', icon: <Globe size={14}/> },
  { value: 'food', label: '美食', icon: <MessageSquare size={14}/> },
  { value: 'group', label: '合影', icon: <Users size={14}/> },
  { value: 'portrait', label: '人像', icon: <UserIcon size={14}/> },
  { value: 'activity', label: '活动', icon: <Camera size={14}/> },
];

// App Configuration Interface
interface AppSettings {
    appName: string;
    appSlogan: string;
    logoUrl?: string; // Optional custom logo URL
}

const DEFAULT_SETTINGS: AppSettings = {
    appName: "TravelLink",
    appSlogan: "旅途印记，分享美好"
};

const TRANS = {
  zh: {
    appSlogan: "旅途印记，分享美好",
    loginIdLabel: "账号 (身份证/ID)",
    loginPlaceholder: "请输入身份证号或系统ID",
    passwordLabel: "密码",
    passwordPlaceholder: "请输入登录密码",
    nameLabel: "姓名",
    phoneLabel: "手机号",
    loginBtn: "安全登录",
    registerBtn: "注册新账号",
    switchToLogin: "已有账号？去登录",
    switchToRegister: "没有账号？去注册",
    guestTip: "测试账号: cust_01 (密码: 123456)",
    adminTip: "管理员: admin_01 (密码: admin)",
    myTours: "我的行程",
    community: "社区广场",
    newTour: "新建行程",
    editTour: "编辑行程",
    backList: "返回",
    uploadPhoto: "上传照片",
    noPhotos: "暂无照片",
    edit: "编辑",
    delete: "删除",
    save: "保存",
    cancel: "取消",
    confirmDelete: "确定要删除吗？该操作无法撤销。",
    profile: "个人资料",
    userMgmt: "用户管理",
    name: "姓名",
    phone: "电话",
    role: "角色",
    action: "操作",
    comments: "评论",
    addComment: "写下你的评论...",
    publish: "发送",
    likes: "赞",
    tags: "标签",
    category: "分类",
    addTag: "添加标签...",
    tourName: "行程名称",
    destination: "目的地",
    startDate: "开始日期",
    duration: "持续时间",
    coverImage: "封面图片",
    desc: "描述",
    all: "全部",
    download: "下载",
    share: "分享",
    shareSuccess: "链接已复制！",
    resetPwd: "重置密码",
    resetConfirm: "确定将密码重置为 123456 吗？",
    uploading: "上传中...",
    filterUser: "上传者",
    filterDate: "日期",
    filterTagged: "被标记的人",
    batchDownload: "一键保存到相册",
    downloadingBatch: "正在保存...",
    batchConfirm: "即将在您的设备上保存 {n} 张照片。请允许浏览器下载多个文件。",
    editInfo: "编辑资料",
    manageGuests: "管理旅客",
    searchGuests: "搜索旅客 (姓名/电话/ID)...",
    guestList: "已添加旅客",
    noGuests: "暂无旅客",
    noResults: "未找到匹配用户",
    saveSuccess: "保存成功！",
    selectMode: "批量管理",
    exitSelect: "退出管理",
    selectedCount: "已选 {n} 张",
    deleteSelected: "删除所选",
    downloadSelected: "下载所选",
    changeDate: "修改日期",
    confirmBatchDelete: "确定要删除选中的 {n} 张照片吗？",
    editItinerary: "编辑行程说明",
    itineraryPlaceholder: "例如：Day 1 抵达东京...",
    updateDate: "更新日期",
    batchError: "操作失败，请重试",
    deleting: "删除中...",
    deleteWarning: "此操作无法撤销。选中的照片将从数据库中永久删除。",
    converting: "格式转换中...",
    selectCover: "从相册选择封面",
    selectCoverTitle: "点击照片设为封面",
    searchTours: "搜索行程 (名称/地点)...",
    confirmTourDelete: "确定要删除行程 \"{name}\" 吗？",
    tourDeleteWarning: "删除行程将同时删除其中的所有照片，此操作无法恢复！",
    todaysTop: "今日热点",
    allTimeTop: "人气精选",
    topPhotoTitle: "获赞最多的照片",
    addUser: "添加用户",
    editUser: "编辑用户",
    roleLabel: "用户角色",
    admin: "管理员",
    customer: "客户",
    idCard: "身份证号 (登录账号)",
    birthday: "生日",
    passwordTip: "新建用户默认密码为 123456",
    userMgmtDesc: "管理系统内所有用户",
    changePwd: "修改密码",
    oldPwd: "旧密码",
    newPwd: "新密码",
    confirmPwd: "确认新密码",
    pwdMismatch: "两次输入的新密码不一致",
    pwdWrong: "旧密码错误",
    pwdSuccess: "密码修改成功",
    siteSettings: "网站设置",
    appName: "网站名称",
    appSloganLabel: "网站标语",
    logoUrl: "Logo URL (可选)",
    uploadAvatar: "点击更换头像",
    uploadingAvatar: "头像上传中..."
  },
  en: {
    appSlogan: "Share your journey, keep the memory.",
    loginIdLabel: "Account (ID Card/System ID)",
    loginPlaceholder: "Enter ID Card or System ID",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter password",
    nameLabel: "Name",
    phoneLabel: "Phone",
    loginBtn: "Secure Login",
    registerBtn: "Register New Account",
    switchToLogin: "Have an account? Login",
    switchToRegister: "No account? Register",
    guestTip: "Test User: cust_01 (Pwd: 123456)",
    adminTip: "Admin: admin_01 (Pwd: admin)",
    myTours: "My Tours",
    community: "Community",
    newTour: "New Tour",
    editTour: "Edit Tour",
    backList: "Back",
    uploadPhoto: "Upload",
    noPhotos: "No photos yet.",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    confirmDelete: "Are you sure you want to delete? This cannot be undone.",
    profile: "Profile",
    userMgmt: "User Management",
    name: "Name",
    phone: "Phone",
    role: "Role",
    action: "Action",
    comments: "Comments",
    addComment: "Add a comment...",
    publish: "Post",
    likes: "Likes",
    tags: "Tags",
    category: "Category",
    addTag: "Add tag...",
    tourName: "Tour Name",
    destination: "Destination",
    startDate: "Start Date",
    duration: "Duration",
    coverImage: "Cover Image",
    desc: "Description",
    all: "All",
    download: "Download",
    share: "Share",
    shareSuccess: "Link copied!",
    resetPwd: "Reset Pwd",
    resetConfirm: "Reset password to 123456?",
    uploading: "Uploading...",
    filterUser: "Uploader",
    filterDate: "Date",
    filterTagged: "Tagged Person",
    batchDownload: "Save All to Gallery",
    downloadingBatch: "Saving...",
    batchConfirm: "About to save {n} photos to your device.",
    editInfo: "Edit Info",
    manageGuests: "Manage Guests",
    searchGuests: "Search guests (Name/Phone/ID)...",
    guestList: "Added Guests",
    noGuests: "No guests added",
    noResults: "No user found",
    saveSuccess: "Saved Successfully!",
    selectMode: "Manage Photos",
    exitSelect: "Exit Manage",
    selectedCount: "{n} Selected",
    deleteSelected: "Delete",
    downloadSelected: "Download",
    changeDate: "Change Date",
    confirmBatchDelete: "Delete {n} selected photos?",
    editItinerary: "Edit Description",
    itineraryPlaceholder: "e.g., Day 1: Arrival...",
    updateDate: "Update Date",
    batchError: "Operation failed, please try again",
    deleting: "Deleting...",
    deleteWarning: "This action cannot be undone. Photos will be permanently deleted.",
    converting: "Converting...",
    selectCover: "Select Cover from Album",
    selectCoverTitle: "Click photo to set as cover",
    searchTours: "Search tours (Name/Location)...",
    confirmTourDelete: "Delete tour \"{name}\"?",
    tourDeleteWarning: "Deleting the tour will also delete all photos within it. This cannot be undone!",
    todaysTop: "Today's Top",
    allTimeTop: "All Time Best",
    topPhotoTitle: "Most Liked Photo",
    addUser: "Add User",
    editUser: "Edit User",
    roleLabel: "User Role",
    admin: "Admin",
    customer: "Customer",
    idCard: "ID Card (Login ID)",
    birthday: "Birthday",
    passwordTip: "Default password for new users is 123456",
    userMgmtDesc: "Manage all users in system",
    changePwd: "Change Password",
    oldPwd: "Old Password",
    newPwd: "New Password",
    confirmPwd: "Confirm Password",
    pwdMismatch: "New passwords do not match",
    pwdWrong: "Incorrect old password",
    pwdSuccess: "Password changed successfully",
    siteSettings: "Site Settings",
    appName: "App Name",
    appSloganLabel: "App Slogan",
    logoUrl: "Logo URL (Optional)",
    uploadAvatar: "Click to change avatar",
    uploadingAvatar: "Uploading..."
  }
};

const INITIAL_USERS: User[] = [
  { id: 'admin_01', name: '王老板 (Admin)', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', role: UserRole.ADMIN, password: 'admin', phoneNumber: '13800138000', idCardNumber: '110101198001010001', birthday: '1980-01-01' },
  { id: 'admin_02', name: '林经理 (Admin)', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gizmo', role: UserRole.ADMIN, password: 'admin', phoneNumber: '13800138001', idCardNumber: '110101198505050002', birthday: '1985-05-05' },
  { id: 'cust_01', name: '李小明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', role: UserRole.CUSTOMER, password: '123456', phoneNumber: '13900000001', idCardNumber: '440101199001011234', birthday: '1990-01-01' },
  { id: 'cust_02', name: '张美丽', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella', role: UserRole.CUSTOMER, password: '123456', phoneNumber: '13900000002', idCardNumber: '440101199202021234', birthday: '1992-02-02' },
];

// --- Sub Components ---

// 1. Login & Register Screen
const LoginScreen = ({ users, onLogin, onRegister, appSettings, language, setLanguage }: any) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ id: '', password: '', name: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const t = TRANS[language];
  const settings = appSettings || DEFAULT_SETTINGS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Simulate slight network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (isRegister) {
      if (!formData.name || !formData.phone) {
        setError("请填写完整信息");
        setLoading(false);
        return;
      }
      try {
        await onRegister({
            id: formData.id,
            idCardNumber: formData.id,
            password: formData.password,
            name: formData.name,
            phoneNumber: formData.phone,
            role: UserRole.CUSTOMER,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.id}`
        });
      } catch(e) {
          setError("Register failed");
      }
    } else {
      const user = users.find((u: User) => (u.idCardNumber === formData.id || u.id === formData.id) && u.password === formData.password);
      if (user) onLogin(user);
      else setError(language === 'zh' ? '账号或密码错误。' : 'Invalid ID or password.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-100 relative">
        <button onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')} className="absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-600 hover:bg-blue-50 flex items-center gap-1">
            <Globe size={12}/> {language === 'zh' ? 'English' : '中文'}
        </button>
        <div className="text-center mb-6">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-blue-500/20 inline-block mb-4 overflow-hidden">
             {settings.logoUrl ? (
                 <img src={settings.logoUrl} className="w-10 h-10 object-contain"/>
             ) : (
                 <Globe className="text-white" size={40} />
             )}
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">{settings.appName}</h1>
          <p className="text-gray-500 mt-2">{settings.appSlogan || t.appSlogan}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.loginIdLabel}</label>
              <input required type="text" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
                value={formData.id} onChange={e => setFormData({...formData, id: e.target.value})} placeholder={t.loginPlaceholder}/>
            </div>
            {isRegister && (
              <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.nameLabel}</label>
                <input required type="text" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={t.nameLabel}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.phoneLabel}</label>
                <input required type="tel" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder={t.phoneLabel}/>
              </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t.passwordLabel}</label>
              <input required type="password" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={t.passwordPlaceholder}/>
            </div>

            {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded-lg text-center">{error}</div>}
            
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? <Loader2 className="animate-spin" size={20}/> : <LogIn size={20} />} 
              {loading ? (language === 'zh' ? "处理中..." : "Processing...") : (isRegister ? t.registerBtn : t.loginBtn)}
            </button>
            
            <div className="text-center pt-2">
              <button type="button" onClick={() => {setIsRegister(!isRegister); setError('');}} className="text-sm text-blue-600 hover:underline">
                {isRegister ? t.switchToLogin : t.switchToRegister}
              </button>
            </div>

            {!isRegister && (
              <div className="text-center mt-4 text-xs text-gray-400 border-t pt-4">
                <p>{t.guestTip}</p><p className="mt-1">{t.adminTip}</p>
              </div>
            )}
        </form>
      </div>
    </div>
  );
};

// Modal Wrapper - Updated to accept hideClose prop and zIndex
const Modal = ({ children, onClose, title, hideClose, zIndex = 50 }: { children: React.ReactNode, onClose: () => void, title?: string, hideClose?: boolean, zIndex?: number }) => (
  <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" style={{ zIndex }}>
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative">
      {title && (
         <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
            <h3 className="font-bold text-lg">{title}</h3>
            <button onClick={onClose}><X size={20}/></button>
         </div>
      )}
      {!title && !hideClose && (
          <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"><X size={20}/></button>
      )}
      <div className="overflow-auto flex-1">{children}</div>
    </div>
  </div>
);

// New Component: Change Password Modal
const ChangePasswordModal = ({ currentUser, onClose, t }: any) => {
    const [pwdData, setPwdData] = useState({ old: '', new: '', confirm: '' });
    const [error, setError] = useState('');

    const handleChangePwd = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (pwdData.new !== pwdData.confirm) {
            setError(t.pwdMismatch);
            return;
        }
        if (currentUser.password !== pwdData.old) {
            setError(t.pwdWrong);
            return;
        }
        try {
            await updateDoc(doc(db, "users", currentUser.id), { password: pwdData.new });
            alert(t.pwdSuccess);
            onClose();
        } catch (err) {
            console.error(err);
            setError("Error updating password");
        }
    };

    return (
        <Modal onClose={onClose} title={t.changePwd} zIndex={60}>
            <form onSubmit={handleChangePwd} className="p-6 space-y-4 w-full max-w-md mx-auto">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.oldPwd}</label>
                    <input type="password" required className="w-full p-2 border rounded-lg" value={pwdData.old} onChange={e => setPwdData({...pwdData, old: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.newPwd}</label>
                    <input type="password" required className="w-full p-2 border rounded-lg" value={pwdData.new} onChange={e => setPwdData({...pwdData, new: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.confirmPwd}</label>
                    <input type="password" required className="w-full p-2 border rounded-lg" value={pwdData.confirm} onChange={e => setPwdData({...pwdData, confirm: e.target.value})} />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end pt-2">
                     <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">{t.save}</button>
                </div>
            </form>
        </Modal>
    );
}

// New Component: Site Settings Modal (Admin Only)
const SiteSettingsModal = ({ currentSettings, onClose, onSave, t }: any) => {
    const [data, setData] = useState<AppSettings>(currentSettings || DEFAULT_SETTINGS);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(data);
    };

    return (
        <Modal onClose={onClose} title={t.siteSettings} zIndex={60}>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                 <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm text-blue-700">
                     Here you can customize the global branding of the application.
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.appName}</label>
                    <input required className="w-full p-2 border rounded-lg" value={data.appName} onChange={e => setData({...data, appName: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.appSloganLabel}</label>
                    <input className="w-full p-2 border rounded-lg" value={data.appSlogan} onChange={e => setData({...data, appSlogan: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.logoUrl}</label>
                    <input className="w-full p-2 border rounded-lg" placeholder="https://..." value={data.logoUrl || ''} onChange={e => setData({...data, logoUrl: e.target.value})} />
                    <p className="text-xs text-gray-500 mt-1">Paste a direct image link (PNG/JPG). If empty, the default Globe icon will be used.</p>
                 </div>
                 <div className="flex justify-end pt-4">
                     <button type="button" onClick={onClose} className="mr-2 px-4 py-2 bg-gray-100 rounded-lg">{t.cancel}</button>
                     <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">{t.save}</button>
                 </div>
            </form>
        </Modal>
    )
}

// 2. Tour Editor Modal (New & Edit) with Header Upload AND Guest Management
const TourEditorModal = ({ tour, users, onClose, onSave, t }: any) => {
  const [formData, setFormData] = useState<Partial<Tour>>(
    tour || {
      name: "", destination: "", startDate: "", duration: "5天", 
      coverImage: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800", 
      description: "",
      allowedUserIds: [] // Ensure array init
    }
  );
  const [uploading, setUploading] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const handleHeaderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
        const file = e.target.files[0];
        const tourId = tour?.id || 'new_tour_headers'; 
        const storageRef = ref(storage, `tour_headers/${tourId}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        setFormData({ ...formData, coverImage: downloadURL });
    } catch (err) {
        console.error("Header upload failed", err);
        alert("Upload failed");
    } finally {
        setUploading(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    onSave(formData);
  };

  // Guest Management Logic
  const addedUserIds = formData.allowedUserIds || [];
  
  const toggleUser = (userId: string) => {
      const current = formData.allowedUserIds || [];
      if (current.includes(userId)) {
          setFormData({ ...formData, allowedUserIds: current.filter(id => id !== userId) });
      } else {
          setFormData({ ...formData, allowedUserIds: [...current, userId] });
      }
  };

  const searchResults = userSearch.length > 0 
    ? users.filter((u:User) => 
        (u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
         u.phoneNumber?.includes(userSearch) || 
         u.id.toLowerCase().includes(userSearch.toLowerCase())) &&
        !addedUserIds.includes(u.id) && 
        u.role === UserRole.CUSTOMER
      ).slice(0, 5) // Limit results
    : [];

  const addedUsers = users.filter((u:User) => addedUserIds.includes(u.id));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-bold text-xl">{tour ? t.editTour : t.newTour}</h3>
            <button onClick={onClose}><X size={20}/></button>
        </div>
        
        <div className="overflow-y-auto p-6 flex-1">
            <form id="tourForm" className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs text-gray-500 font-bold uppercase mb-1 block">{t.tourName}</label><input required className="w-full border p-2 rounded-lg" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})}/></div>
                    <div><label className="text-xs text-gray-500 font-bold uppercase mb-1 block">{t.destination}</label><input required className="w-full border p-2 rounded-lg" value={formData.destination} onChange={e=>setFormData({...formData, destination: e.target.value})}/></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs text-gray-500 font-bold uppercase mb-1 block">{t.startDate}</label><input type="date" required className="w-full border p-2 rounded-lg" value={formData.startDate} onChange={e=>setFormData({...formData, startDate: e.target.value})}/></div>
                    <div><label className="text-xs text-gray-500 font-bold uppercase mb-1 block">{t.duration}</label><input required className="w-full border p-2 rounded-lg" value={formData.duration} onChange={e=>setFormData({...formData, duration: e.target.value})}/></div>
                </div>
                
                {/* Guest Management Section */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <label className="text-xs text-gray-500 font-bold uppercase mb-3 block flex items-center gap-2">
                        <Users size={14}/> {t.manageGuests}
                    </label>
                    
                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <div className="flex items-center border bg-white rounded-lg px-3 py-2 focus-within:ring-2 ring-blue-500">
                            <Search size={16} className="text-gray-400 mr-2"/>
                            <input 
                                className="flex-1 outline-none text-sm" 
                                placeholder={t.searchGuests}
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                            />
                        </div>
                        {/* Search Results Dropdown */}
                        {userSearch && (
                            <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg mt-1 z-10 max-h-48 overflow-y-auto">
                                {searchResults.length > 0 ? searchResults.map((u:User) => (
                                    <div key={u.id} className="p-2 hover:bg-gray-50 flex justify-between items-center cursor-pointer border-b last:border-0" onClick={() => {toggleUser(u.id); setUserSearch('');}}>
                                        <div className="flex items-center gap-2">
                                            <img src={u.avatar} className="w-8 h-8 rounded-full"/>
                                            <div>
                                                <div className="text-sm font-bold">{u.name}</div>
                                                <div className="text-xs text-gray-400">{u.phoneNumber || u.id}</div>
                                            </div>
                                        </div>
                                        <Plus size={16} className="text-blue-600"/>
                                    </div>
                                )) : (
                                    <div className="p-3 text-center text-xs text-gray-400">{t.noResults}</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Added Guests List */}
                    <div>
                        <div className="text-xs text-gray-400 mb-2">{t.guestList} ({addedUsers.length})</div>
                        <div className="flex flex-wrap gap-2">
                            {addedUsers.map((u:User) => (
                                <div key={u.id} className="bg-white border rounded-full pl-1 pr-2 py-1 flex items-center gap-2 shadow-sm">
                                    <img src={u.avatar} className="w-6 h-6 rounded-full"/>
                                    <span className="text-xs font-medium">{u.name}</span>
                                    <button type="button" onClick={() => toggleUser(u.id)} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                                </div>
                            ))}
                            {addedUsers.length === 0 && <span className="text-xs text-gray-400 italic">{t.noGuests}</span>}
                        </div>
                    </div>
                </div>

                {/* Header Image Upload */}
                <div>
                    <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">{t.coverImage}</label>
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0 border">
                            {formData.coverImage ? (
                                <img src={formData.coverImage} className="w-full h-full object-cover"/>
                            ) : <ImageIcon className="m-auto mt-4 text-gray-400" size={20}/>}
                        </div>
                        <label className="flex-1">
                            <span className={`inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm cursor-pointer hover:bg-gray-200 transition ${uploading ? 'opacity-50' : ''}`}>
                                {uploading ? t.uploading : t.uploadPhoto}
                            </span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleHeaderUpload} disabled={uploading}/>
                        </label>
                    </div>
                </div>

                <div><label className="text-xs text-gray-500 font-bold uppercase mb-1 block">{t.desc}</label><textarea className="w-full border p-2 rounded-lg h-20" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})}/></div>
            </form>
        </div>
        
        <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
            <button type="button" onClick={onClose} className="px-6 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition font-medium">{t.cancel}</button>
            <button type="button" onClick={() => handleSubmit()} disabled={uploading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md">{t.save}</button>
        </div>
      </div>
    </div>
  );
};

// New Component: User Editor Modal
const UserEditorModal = ({ user, onClose, onSave, t }: any) => {
    const isNew = !user;
    const [formData, setFormData] = useState<User>(user || {
        id: '', 
        name: '', 
        phoneNumber: '', 
        idCardNumber: '', 
        role: UserRole.CUSTOMER,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
        password: '123456',
        birthday: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalData = { ...formData };
        if(isNew && !finalData.id) finalData.id = finalData.idCardNumber || 'user_' + Date.now();
        onSave(finalData);
    };

    return (
        <Modal onClose={onClose} title={isNew ? t.addUser : t.editUser} zIndex={60}>
             <form onSubmit={handleSubmit} className="p-6 space-y-4">
                 <div className="flex justify-center mb-4">
                    <img src={formData.avatar} className="w-20 h-20 rounded-full border-2 border-gray-100 bg-gray-50"/>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t.nameLabel}</label>
                        <input required className="w-full border p-2 rounded-lg" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t.phoneLabel}</label>
                        <input required className="w-full border p-2 rounded-lg" value={formData.phoneNumber} onChange={e=>setFormData({...formData, phoneNumber: e.target.value})} />
                     </div>
                 </div>

                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t.idCard}</label>
                    <input 
                        required 
                        disabled={!isNew}
                        className={`w-full border p-2 rounded-lg ${!isNew ? 'bg-gray-100 text-gray-500' : ''}`} 
                        value={formData.idCardNumber} 
                        onChange={e=>setFormData({...formData, idCardNumber: e.target.value, id: isNew ? e.target.value : formData.id})} 
                    />
                    {isNew && <p className="text-[10px] text-gray-400 mt-1">{t.passwordTip}</p>}
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t.roleLabel}</label>
                        <select className="w-full border p-2 rounded-lg bg-white" value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value as UserRole})}>
                            <option value={UserRole.CUSTOMER}>{t.customer}</option>
                            <option value={UserRole.ADMIN}>{t.admin}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t.birthday}</label>
                        <input type="date" className="w-full border p-2 rounded-lg" value={formData.birthday || ''} onChange={e=>setFormData({...formData, birthday: e.target.value})} />
                    </div>
                 </div>

                 <div className="pt-4 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600">{t.cancel}</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md">{t.save}</button>
                 </div>
             </form>
        </Modal>
    )
}

// 3. Photo Lightbox with Download & Share & Edit
const PhotoLightbox = ({ photo, user, users, onClose, onUpdate, onLike, onComment, t }: any) => {
  const [commentText, setCommentText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  // Important: Initialize editData with current photo data, and update when photo changes
  const [editData, setEditData] = useState({ caption: photo.caption, category: photo.category, tags: photo.tags || [] });

  useEffect(() => {
    setEditData({ caption: photo.caption, category: photo.category, tags: photo.tags || [] });
    setIsEditing(false); // Reset edit mode when swiping to new photo
  }, [photo]);

  const photoOwner = users.find((u:User) => u.id === photo.uploadedBy);
  const isOwnerOrAdmin = user.id === photo.uploadedBy || user.role === UserRole.ADMIN;

  const handleSaveEdit = () => {
    onUpdate(photo.id, editData);
    setIsEditing(false);
  };

  const toggleTag = (userId: string) => {
    const currentTags = editData.tags || [];
    if (currentTags.includes(userId)) {
      setEditData({...editData, tags: currentTags.filter((id:string) => id !== userId)});
    } else {
      setEditData({...editData, tags: [...currentTags, userId]});
    }
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment(photo.id, commentText);
    setCommentText("");
  };

  const handleDownload = async () => {
    try {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `photo_${photo.id}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
        window.open(photo.url, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'TravelLink Photo',
                text: photo.caption,
                url: photo.url,
            });
        } catch (err) {
            console.log('Share canceled');
        }
    } else {
        navigator.clipboard.writeText(photo.url).then(() => {
            alert(t.shareSuccess);
        });
    }
  };

  return (
    <Modal onClose={onClose} hideClose={true}>
      <div className="flex flex-col md:flex-row h-full md:h-[80vh]">
        {/* Left: Image */}
        <div className="bg-black flex items-center justify-center flex-1 md:w-2/3 relative group p-4">
           {/* Mobile Close Button (Absolute) */}
           <button onClick={onClose} className="md:hidden absolute top-4 right-4 z-20 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"><X size={20}/></button>

           <img src={photo.url} className="max-w-full max-h-[75vh] object-contain" />
           
           {/* Tags Overlay on Image */}
           {!isEditing && photo.tags?.map((tagId:string) => {
              const taggedUser = users.find((u:User) => u.id === tagId);
              if(!taggedUser) return null;
              return (
                <div key={tagId} className="absolute bottom-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 animate-in fade-in z-10">
                  <Tag size={10}/> {taggedUser.name}
                </div>
              );
           })}
        </div>
        
        {/* Right: Info & Interaction */}
        <div className="flex flex-col md:w-1/3 bg-white border-l border-gray-100 h-[50vh] md:h-auto">
           {/* Header with Edit Button - MODIFIED: Added Close Button Here for Desktop */}
           <div className="p-4 border-b border-gray-100 flex justify-between items-start">
              <div className="flex items-center gap-3">
                  <img src={photoOwner?.avatar} className="w-10 h-10 rounded-full border border-gray-200"/>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{photoOwner?.name}</p>
                    <p className="text-xs text-gray-500">{photo.date}</p>
                  </div>
              </div>
              
              <div className="flex items-center gap-2">
                  {/* Edit Button */}
                  {isOwnerOrAdmin && !isEditing && (
                    <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition"><Edit3 size={16}/></button>
                  )}
                  {/* Desktop Close Button in Header Flow */}
                  <button onClick={onClose} className="hidden md:flex p-2 hover:bg-gray-100 rounded-full text-gray-500 transition"><X size={20}/></button>
              </div>
           </div>
           
           {/* Content Area */}
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isEditing ? (
                <div className="space-y-4 bg-white p-1 rounded-xl animate-in fade-in slide-in-from-right-2">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">{t.category}</label>
                      <div className="flex flex-wrap gap-2">
                        {PHOTO_CATEGORIES.map(cat => (
                          <button key={cat.value} onClick={() => setEditData({...editData, category: cat.value})}
                            className={`px-3 py-2 rounded-lg text-xs flex items-center gap-2 border transition ${editData.category === cat.value ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                            {cat.icon} {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Caption</label>
                      <textarea className="w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={3} value={editData.caption} onChange={e=>setEditData({...editData, caption: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">{t.tags} (Click to tag)</label>
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50 p-2 space-y-1">
                        {users.map((u:User) => (
                          <div key={u.id} onClick={() => toggleTag(u.id)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition border ${editData.tags?.includes(u.id) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-transparent hover:bg-white'}`}>
                             <div className={`w-4 h-4 rounded border flex items-center justify-center ${editData.tags?.includes(u.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                {editData.tags?.includes(u.id) && <Check size={10} className="text-white"/>}
                             </div>
                             <img src={u.avatar} className="w-6 h-6 rounded-full"/>
                             <span className="text-sm font-medium">{u.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 mt-2">
                      <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium">{t.cancel}</button>
                      <button onClick={handleSaveEdit} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition font-medium">{t.save}</button>
                    </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-gray-800 leading-relaxed font-medium">{photo.caption}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full flex items-center gap-1 border border-blue-100">
                        {PHOTO_CATEGORIES.find(c => c.value === photo.category)?.icon} {PHOTO_CATEGORIES.find(c => c.value === photo.category)?.label || photo.category}
                      </span>
                      {photo.tags?.map((tagId:string) => {
                         const u = users.find((user:User) => user.id === tagId);
                         return u ? <span key={tagId} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full flex items-center gap-1 border border-gray-200"><Tag size={10}/> {u.name}</span> : null;
                      })}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase">{t.comments}</h4>
                    {(!photo.comments || photo.comments.length === 0) && (
                        <div className="text-center text-gray-400 py-4 text-sm italic">{t.noComments}</div>
                    )}
                    <div className="space-y-3">
                      {photo.comments?.map((c: Comment, idx: number) => {
                          const cUser = users.find((u:User) => u.id === c.userId);
                          return (
                              <div key={idx} className="flex gap-2 items-start text-sm group">
                                  <img src={cUser?.avatar} className="w-7 h-7 rounded-full mt-1"/>
                                  <div className="bg-gray-50 p-2 px-3 rounded-2xl rounded-tl-none hover:bg-gray-100 transition-colors">
                                      <span className="font-bold text-xs block text-blue-600">{cUser?.name}</span>
                                      <p className="text-gray-700">{c.text}</p>
                                  </div>
                              </div>
                          );
                      })}
                    </div>
                  </div>
                </>
              )}
           </div>
           
           {/* Actions & Input */}
           <div className="p-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between mb-3 text-gray-600">
                  <div className="flex gap-4">
                      <button onClick={() => onLike(photo.id)} className="flex items-center gap-1 hover:text-red-500 transition-colors group">
                          <Heart size={20} className={photo.likes > 0 ? "fill-red-500 text-red-500" : "group-hover:text-red-500"}/> 
                          <span className="text-sm font-medium">{photo.likes || 0}</span>
                      </button>
                      <button onClick={handleDownload} className="flex items-center gap-1 hover:text-blue-500 transition-colors" title={t.download}>
                          <Download size={20}/>
                      </button>
                      <button onClick={handleShare} className="flex items-center gap-1 hover:text-blue-500 transition-colors" title={t.share}>
                          <Share2 size={20}/>
                      </button>
                  </div>
              </div>
              <form onSubmit={handleSubmitComment} className="flex gap-2">
                  <input className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={t.addComment} value={commentText} onChange={e => setCommentText(e.target.value)} disabled={isEditing} />
                  <button type="submit" disabled={!commentText.trim() || isEditing} className="bg-blue-600 disabled:opacity-50 text-white p-2 rounded-full hover:bg-blue-700 transition"><Send size={16}/></button>
              </form>
           </div>
        </div>
      </div>
    </Modal>
  );
};

export default function App() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Data State
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  
  // App Settings State
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  // UI State
  const [activeTab, setActiveTab] = useState<'tours' | 'community'>('tours');
  
  // REFACTORED: Store ID instead of object for reactivity
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  
  // Derived State (Always fresh)
  const selectedTour = useMemo(() => 
    tours.find(t => t.id === selectedTourId) || null
  , [tours, selectedTourId]);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string | null>(null); 
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [filterTaggedUser, setFilterTaggedUser] = useState<string | null>(null);
  
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [batchDownloading, setBatchDownloading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Batch Selection & Edit State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [isDateEditorOpen, setIsDateEditorOpen] = useState(false);
  const [batchDate, setBatchDate] = useState("");
  const [editingItinerary, setEditingItinerary] = useState<{date: string, text: string} | null>(null);
  
  // New States for better deletion UX
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // State for selecting cover from album
  const [isCoverSelectorOpen, setIsCoverSelectorOpen] = useState(false);
  // New States for Tour Management (Search & Delete)
  const [tourSearchQuery, setTourSearchQuery] = useState("");
  const [tourToDelete, setTourToDelete] = useState<Tour | null>(null);
  // User Management State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUserEditorOpen, setIsUserEditorOpen] = useState(false);
  // Change Password State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  // Site Settings State (Admin)
  const [isSiteSettingsOpen, setIsSiteSettingsOpen] = useState(false);

  const [editorTour, setEditorTour] = useState<Tour | null>(null); 
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  
  const t = TRANS[language];

  // Calculate Top Photo
  const topPhotoData = useMemo(() => {
    if (photos.length === 0) return null;
    
    const today = new Date().toISOString().split('T')[0];
    const todaysPhotos = photos.filter(p => p.date === today);
    
    if (todaysPhotos.length > 0) {
        // Find max likes today
        const maxLikes = Math.max(...todaysPhotos.map(p => p.likes || 0));
        const top = todaysPhotos.find(p => (p.likes || 0) === maxLikes);
        return { photo: top, isToday: true };
    } else {
        // Fallback to all time
        const maxLikes = Math.max(...photos.map(p => p.likes || 0));
        const top = photos.find(p => (p.likes || 0) === maxLikes);
        return { photo: top, isToday: false };
    }
  }, [photos]);

  // Listen to Firebase Data (Users, Tours, Photos, Settings)
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        const fetchedUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        const combined = [...fetchedUsers]; // Firestore is the source of truth
        INITIAL_USERS.forEach(u => {
           if (!combined.find(c => c.id === u.id)) combined.push(u);
        });
        setUsers(combined);
        // Update current user if exists (to reflect password changes)
        if (currentUser) {
            const updated = combined.find(u => u.id === currentUser.id);
            if(updated) setCurrentUser(updated);
        }
    });

    const unsubTours = onSnapshot(collection(db, "tours"), (snap) => {
        setTours(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tour)));
    });

    const unsubPhotos = onSnapshot(collection(db, "photos"), (snap) => {
        setPhotos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo)));
    });

    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (doc) => {
        if(doc.exists()) {
            setAppSettings(doc.data() as AppSettings);
        }
    });

    return () => { unsubUsers(); unsubTours(); unsubPhotos(); unsubSettings(); };
  }, [currentUser?.id]); // Only dependency needed for re-fetching logic if user changes, but mainly for updating currentUser

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setSelectedTourId(null);
    setActiveTab('community'); 
  };

  const handleRegister = async (newUser: User) => {
    try {
      await setDoc(doc(db, "users", newUser.id), newUser);
      setCurrentUser(newUser);
      setIsAuthenticated(true);
      setSelectedTourId(null);
    } catch (e) {
      console.error("Register failed", e);
      alert("Registration failed: " + e);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  // --- Photo Logic ---
  const handleRealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedTour || !currentUser) return;
    setUploading(true);
    setUploadStatus(t.uploading);

    try {
        for (let i = 0; i < e.target.files.length; i++) {
            let file = e.target.files[i];

            // HEIC/HEIF Conversion Logic
            if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
              try {
                setUploadStatus(t.converting);
                const convertedBlob = await heic2any({
                  blob: file,
                  toType: 'image/jpeg',
                  quality: 0.8
                });
                // Handle array result (rare for single photo upload but possible with heic2any)
                const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                
                // Create new File object with jpg extension
                file = new File([finalBlob], file.name.replace(/\.heic$/i, ".jpg"), {
                  type: "image/jpeg",
                });
              } catch (conversionErr) {
                console.error("HEIC conversion failed, uploading original.", conversionErr);
              }
            }

            setUploadStatus(`${t.uploading} ${i + 1}/${e.target.files.length}`);
            const storageRef = ref(storage, `tours/${selectedTour.id}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Generate AI Caption
            const aiCaption = await generatePhotoCaption(selectedTour.destination, language);

            const newPhoto: any = {
                tourId: selectedTour.id,
                uploadedBy: currentUser.id,
                ownerId: currentUser.id,
                url: downloadURL,
                caption: aiCaption || "我分享了一张照片",
                date: new Date().toISOString().split('T')[0],
                category: 'scenery', // Default
                tags: [], likes: 0, isShared: true, comments: [], 
                location: selectedTour.destination
            };
            await addDoc(collection(db, "photos"), newPhoto);
        }
    } catch (err) {
        console.error(err);
        alert("Upload Error");
    } finally {
        setUploading(false);
        setUploadStatus('');
    }
  };

  const handlePhotoUpdate = async (photoId: string, data: any) => {
    await updateDoc(doc(db, "photos", photoId), data);
  };

  const handleLike = async (photoId: string) => {
     await updateDoc(doc(db, "photos", photoId), { likes: increment(1) });
  };

  const handleComment = async (photoId: string, text: string) => {
     if (!currentUser) return;
     const newComment: Comment = {
        id: Date.now().toString(),
        userId: currentUser.id,
        text,
        timestamp: new Date().toISOString()
     };
     await updateDoc(doc(db, "photos", photoId), { comments: arrayUnion(newComment) });
  };

  // --- Tour Logic ---
  const openTourEditor = (tour: Tour | null) => {
    setEditorTour(tour);
    setIsEditorOpen(true);
  };

  const handleSaveTour = async (tourData: Partial<Tour>) => {
    try {
      if (editorTour) {
        // Edit
        await updateDoc(doc(db, "tours", editorTour.id), tourData as { [x: string]: any });
      } else {
        // Create
        await addDoc(collection(db, "tours"), {
           ...tourData,
           cities: [],
           allowedUserIds: tourData.allowedUserIds || [],
           itinerary: {}
        });
      }
      setIsEditorOpen(false);
      alert(t.saveSuccess); 
    } catch (e) {
      console.error("Error saving tour", e);
      alert("Failed to save tour. Please check permissions.");
    }
  };

  // Replaced direct delete with modal confirmation state
  const handleDeleteTourClick = (tour: Tour) => {
    setTourToDelete(tour);
  };

  const confirmDeleteTour = async () => {
    if (!tourToDelete) return;
    setIsDeleting(true);
    try {
        await deleteDoc(doc(db, "tours", tourToDelete.id));
        setTourToDelete(null);
    } catch (error) {
        console.error("Delete failed", error);
        alert("Delete failed. You might not have permission.");
    } finally {
        setIsDeleting(false);
    }
  };
  
  const handleSelectCoverFromAlbum = async (url: string) => {
      if(!selectedTour) return;
      try {
        await updateDoc(doc(db, "tours", selectedTour.id), { coverImage: url });
        setIsCoverSelectorOpen(false);
        alert(t.saveSuccess);
      } catch (e) {
        console.error("Failed to update cover", e);
        alert("Update failed");
      }
  };

  const handleResetPassword = async (userId: string) => {
    if(confirm(t.resetConfirm)) {
       try {
         const userRef = doc(db, "users", userId);
         await setDoc(userRef, { password: "123456" }, { merge: true });
         alert("Password reset successfully.");
       } catch (e) {
         console.error(e);
         alert("Reset failed.");
       }
    }
  }

  const handleSaveUser = async (userData: User) => {
    try {
        await setDoc(doc(db, "users", userData.id), userData, { merge: true });
        setIsUserEditorOpen(false);
        alert(t.saveSuccess);
    } catch(e) {
        console.error(e);
        alert("Error saving user");
    }
  }

  const handleSaveSiteSettings = async (newSettings: AppSettings) => {
      try {
          await setDoc(doc(db, "settings", "global"), newSettings);
          setIsSiteSettingsOpen(false);
          alert(t.saveSuccess);
      } catch (e) {
          console.error(e);
          alert("Error saving settings");
      }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !currentUser) return;
    setAvatarUploading(true);
    try {
        const file = e.target.files[0];
        const storageRef = ref(storage, `avatars/${currentUser.id}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Update Firestore
        await updateDoc(doc(db, "users", currentUser.id), { avatar: downloadURL });

        // Optimistically update local state to reflect change immediately
        setCurrentUser({ ...currentUser, avatar: downloadURL });
        alert(t.saveSuccess);
    } catch (error) {
        console.error("Avatar upload failed", error);
        alert("Failed to upload avatar.");
    } finally {
        setAvatarUploading(false);
    }
  };

  // --- Batch & Itinerary Logic ---
  const handleToggleSelection = (photoId: string) => {
      if (selectedPhotoIds.includes(photoId)) {
          setSelectedPhotoIds(selectedPhotoIds.filter(id => id !== photoId));
      } else {
          setSelectedPhotoIds([...selectedPhotoIds, photoId]);
      }
  };

  const handleBatchDelete = async () => {
    if(selectedPhotoIds.length === 0) return;
    
    setIsDeleting(true);
    try {
        const batch = writeBatch(db);
        selectedPhotoIds.forEach(id => {
            const ref = doc(db, "photos", id);
            batch.delete(ref);
        });
        await batch.commit();
        setSelectedPhotoIds([]);
        setIsSelectionMode(false);
        setIsDeleteConfirmOpen(false);
        alert(t.saveSuccess);
    } catch(e) {
        console.error(e);
        alert(t.batchError);
    } finally {
        setIsDeleting(false);
    }
  };

  const handleBatchDownloadSelected = async () => {
     if (selectedPhotoIds.length === 0) return;
     setBatchDownloading(true);
     const photosToDownload = photos.filter(p => selectedPhotoIds.includes(p.id));
     
     // Robust download function
     const downloadOne = async (photo: Photo) => {
        try {
            const response = await fetch(photo.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `photo_${photo.date}_${photo.id}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch(e) {
            console.error("Direct download failed, trying new tab", photo.id);
            // Fallback: Open in new window if CORS blocks download attribute
            window.open(photo.url, '_blank');
        }
     };

     for (let i = 0; i < photosToDownload.length; i++) {
        await new Promise(r => setTimeout(r, 500)); 
        await downloadOne(photosToDownload[i]);
     }
     setBatchDownloading(false);
     setSelectedPhotoIds([]);
     setIsSelectionMode(false);
  };

  const handleBatchDateUpdate = async () => {
      if(!batchDate || selectedPhotoIds.length === 0) return;
      try {
        const batch = writeBatch(db);
        selectedPhotoIds.forEach(id => {
            const ref = doc(db, "photos", id);
            batch.update(ref, { date: batchDate });
        });
        await batch.commit();
        setSelectedPhotoIds([]);
        setIsSelectionMode(false);
        setIsDateEditorOpen(false);
        setBatchDate("");
        alert(t.saveSuccess);
      } catch(e) {
          console.error(e);
          alert(t.batchError);
      }
  };

  const handleSaveItineraryDescription = async () => {
      if(!editingItinerary || !selectedTour) return;
      try {
          const updatedItinerary = { 
              ...(selectedTour.itinerary || {}), 
              [editingItinerary.date]: editingItinerary.text 
          };
          await updateDoc(doc(db, "tours", selectedTour.id), { itinerary: updatedItinerary });
          setEditingItinerary(null);
      } catch(e) {
          console.error(e);
          alert("Update Failed");
      }
  };


  // Helper for filtering photos in Tour Details
  const getFilteredTourPhotos = () => {
    if (!selectedTour) return [];
    let list = photos.filter(p => p.tourId === selectedTour.id);
    if (filterCategory) {
        list = list.filter(p => p.category === filterCategory);
    }
    if (filterUser) {
        list = list.filter(p => p.uploadedBy === filterUser);
    }
    if (filterDate) {
        list = list.filter(p => p.date === filterDate);
    }
    if (filterTaggedUser) {
        list = list.filter(p => p.tags && p.tags.includes(filterTaggedUser));
    }
    return list;
  };

  const availableUploaders = Array.from(new Set(photos.filter(p => p.tourId === selectedTour?.id).map(p => p.uploadedBy)));
  const availableDates = Array.from(new Set(photos.filter(p => p.tourId === selectedTour?.id).map(p => p.date))).sort().reverse();
  
  const availableTaggedUsers = Array.from(new Set(
      photos.filter(p => p.tourId === selectedTour?.id)
            .flatMap(p => p.tags || [])
  ));

  // --- Grouping Logic for Timeline View ---
  const filteredPhotos = getFilteredTourPhotos();
  // Sort dates chronologically for itinerary flow
  const groupedDates = Array.from(new Set(filteredPhotos.map(p => p.date))).sort();
  
  // Batch Download All (Sequential Loop - No Zip)
  const handleBatchDownload = async () => {
     const photosToDownload = filteredPhotos;
     if (photosToDownload.length === 0) return;
     if(!confirm(t.batchConfirm.replace('{n}', photosToDownload.length.toString()))) return;

     setBatchDownloading(true);
     const downloadOne = async (photo: Photo) => {
        try {
            const response = await fetch(photo.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `photo_${photo.date}_${photo.id}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch(e) { 
             window.open(photo.url, '_blank');
        }
     };

     for (let i = 0; i < photosToDownload.length; i++) {
        await new Promise(r => setTimeout(r, 500)); 
        await downloadOne(photosToDownload[i]);
     }
     setBatchDownloading(false);
  };

  if (!isAuthenticated) {
      return <LoginScreen users={users} onLogin={handleLogin} onRegister={handleRegister} appSettings={appSettings} language={language} setLanguage={setLanguage} />;
  }

  // Visibility Permission Logic & Search Filter
  const visibleTours = tours.filter(tour => {
      // 1. Permission Check
      const hasPermission = currentUser?.role === UserRole.ADMIN || (tour.allowedUserIds && tour.allowedUserIds.includes(currentUser?.id || ''));
      if (!hasPermission) return false;

      // 2. Search Filter
      if (!tourSearchQuery) return true;
      const q = tourSearchQuery.toLowerCase();
      return tour.name.toLowerCase().includes(q) || tour.destination.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans pb-20">
        {/* Navbar */}
        <nav className="bg-white shadow-sm sticky top-0 z-40 px-6 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-xl text-blue-600 cursor-pointer" onClick={() => {setSelectedTourId(null); setActiveTab('community');}}>
                {appSettings.logoUrl ? (
                    <img src={appSettings.logoUrl} className="w-8 h-8 object-contain"/>
                ) : (
                    <Globe /> 
                )}
                {appSettings.appName}
            </div>
            <div className="flex items-center gap-2 md:gap-4">
                <div className="hidden md:flex gap-1 bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => {setActiveTab('community'); setSelectedTourId(null);}} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab === 'community' && !selectedTour ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>{t.community}</button>
                    <button onClick={() => {setActiveTab('tours'); setSelectedTourId(null);}} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab === 'tours' || selectedTour ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>{t.myTours}</button>
                </div>
                <button onClick={() => setIsProfileOpen(true)} className="flex items-center gap-2 text-sm font-bold hover:bg-gray-100 p-1.5 rounded-lg transition">
                    <img src={currentUser?.avatar} className="w-8 h-8 rounded-full border border-gray-200"/>
                    <span className="hidden md:inline">{currentUser?.name}</span>
                </button>
                {currentUser?.role === UserRole.ADMIN && (
                    <div className="flex gap-1">
                        <button onClick={() => setIsUserManagementOpen(true)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title={t.userMgmt}><Users size={20}/></button>
                        <button onClick={() => setIsSiteSettingsOpen(true)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600" title={t.siteSettings}><Cog size={20}/></button>
                    </div>
                )}
                <button onClick={handleLogout} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition"><LogOut size={20}/></button>
            </div>
        </nav>

        {/* Mobile Tab Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 z-40 flex justify-around">
            <button onClick={() => {setActiveTab('community'); setSelectedTourId(null);}} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'community' && !selectedTour ? 'text-blue-600' : 'text-gray-400'}`}>
                <LayoutGrid size={24}/>
                <span className="text-[10px] font-bold mt-1">{t.community}</span>
            </button>
            <button onClick={() => {setActiveTab('tours'); setSelectedTourId(null);}} className={`flex flex-col items-center p-2 rounded-lg ${activeTab === 'tours' || selectedTour ? 'text-blue-600' : 'text-gray-400'}`}>
                <MapPin size={24}/>
                <span className="text-[10px] font-bold mt-1">{t.myTours}</span>
            </button>
        </div>

        <main className="max-w-7xl mx-auto px-4 py-6">
            {/* View: Selected Tour Details */}
            {selectedTour ? (
                <div className="animate-in slide-in-from-right-4 duration-300">
                    <button onClick={() => {setSelectedTourId(null); setFilterCategory(null); setFilterDate(null); setFilterUser(null); setFilterTaggedUser(null); setIsSelectionMode(false);}} className="mb-4 text-gray-500 hover:text-blue-600 flex items-center gap-1 font-medium transition-colors">
                        <Globe size={16} className="rotate-90"/> {t.backList}
                    </button>
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
                        <div className="h-48 md:h-72 relative">
                            <img src={selectedTour.coverImage} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                                <div className="flex justify-between items-end w-full">
                                    <div>
                                        <h1 className="text-2xl md:text-4xl font-bold text-white mb-1">{selectedTour.name}</h1>
                                        <p className="text-white/80 text-sm flex items-center gap-1"><MapPin size={14}/> {selectedTour.destination}</p>
                                    </div>
                                    {/* Edit Tour Info Buttons */}
                                    {currentUser?.role === UserRole.ADMIN && (
                                        <div className="flex gap-2">
                                          <button 
                                              onClick={(e) => { e.stopPropagation(); setIsCoverSelectorOpen(true); }}
                                              className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                                          >
                                              <LayoutTemplate size={16}/> {t.selectCover}
                                          </button>
                                          <button 
                                              onClick={(e) => { e.stopPropagation(); openTourEditor(selectedTour); }}
                                              className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition"
                                          >
                                              <Edit3 size={16}/> {t.editInfo}
                                          </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Enhanced Filter Bar */}
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col space-y-4">
                            {/* Row 1: Categories & Upload */}
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                                <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start w-full">
                                    <button onClick={() => setFilterCategory(null)} className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition border ${!filterCategory ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>{t.all}</button>
                                    {PHOTO_CATEGORIES.map(cat => (
                                        <button key={cat.value} onClick={() => setFilterCategory(cat.value)} className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap flex items-center gap-1 transition border ${filterCategory === cat.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                                            {cat.icon} {cat.label}
                                        </button>
                                    ))}
                                </div>
                                
                                <label className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center gap-2 shadow-sm text-sm font-bold flex-shrink-0 transition ${uploading ? 'opacity-50' : ''}`}>
                                    <Upload size={16}/> {uploading ? (uploadStatus || t.uploading) : t.uploadPhoto}
                                    <input type="file" className="hidden" multiple accept="image/*" onChange={handleRealUpload} disabled={uploading}/>
                                </label>
                            </div>

                            {/* Row 2: Advanced Filters (User, Date, Batch Download) */}
                            <div className="flex flex-col md:flex-row items-center gap-3 pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-2 w-full md:w-auto">
                                    <Filter size={14} className="text-gray-400"/>
                                    {/* User Filter */}
                                    <div className="relative group flex-1 md:flex-none">
                                        <select 
                                        className="w-full md:w-auto appearance-none bg-white border border-gray-200 text-gray-700 text-xs rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-blue-400 transition"
                                        value={filterUser || ''}
                                        onChange={(e) => setFilterUser(e.target.value || null)}
                                        >
                                            <option value="">{t.filterUser}: {t.all}</option>
                                            {availableUploaders.map(uid => {
                                                const u = users.find(user => user.id === uid);
                                                return <option key={uid} value={uid}>{u?.name || uid}</option>
                                            })}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14}/>
                                    </div>
                                    
                                    {/* Tagged User Filter (NEW) */}
                                    <div className="relative group flex-1 md:flex-none">
                                        <select 
                                        className="w-full md:w-auto appearance-none bg-white border border-gray-200 text-gray-700 text-xs rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-blue-400 transition"
                                        value={filterTaggedUser || ''}
                                        onChange={(e) => setFilterTaggedUser(e.target.value || null)}
                                        >
                                            <option value="">{t.filterTagged}: {t.all}</option>
                                            {availableTaggedUsers.map(uid => {
                                                const u = users.find(user => user.id === uid);
                                                return <option key={uid} value={uid}>{u?.name || uid}</option>
                                            })}
                                        </select>
                                        <Tag className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14}/>
                                    </div>

                                    {/* Date Filter */}
                                    <div className="relative group flex-1 md:flex-none">
                                        <select 
                                        className="w-full md:w-auto appearance-none bg-white border border-gray-200 text-gray-700 text-xs rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer hover:border-blue-400 transition"
                                        value={filterDate || ''}
                                        onChange={(e) => setFilterDate(e.target.value || null)}
                                        >
                                            <option value="">{t.filterDate}: {t.all}</option>
                                            {availableDates.map(date => (
                                                <option key={date} value={date}>{date}</option>
                                            ))}
                                        </select>
                                        <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14}/>
                                    </div>
                                    
                                    {(filterUser || filterDate || filterCategory || filterTaggedUser) && (
                                        <button onClick={() => {setFilterCategory(null); setFilterUser(null); setFilterDate(null); setFilterTaggedUser(null);}} className="text-xs text-red-500 hover:text-red-700 underline px-1">
                                            <X size={14}/>
                                        </button>
                                    )}
                                </div>

                                <div className="flex-1"></div>

                                {/* Select Mode Toggle */}
                                <button 
                                  type="button"
                                  onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedPhotoIds([]); }}
                                  className={`w-full md:w-auto flex justify-center items-center gap-2 text-xs px-4 py-2 rounded-lg transition shadow-sm border ${isSelectionMode ? 'bg-blue-50 border-blue-200 text-blue-600 font-bold' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'}`}
                                >
                                    {isSelectionMode ? <CheckSquare size={14}/> : <Square size={14}/>}
                                    {isSelectionMode ? t.exitSelect : t.selectMode}
                                </button>
                                
                                {/* Batch Download All (Only show if not in selection mode) */}
                                {!isSelectionMode && (
                                    <button 
                                    type="button"
                                    onClick={handleBatchDownload} 
                                    disabled={batchDownloading}
                                    className="w-full md:w-auto flex justify-center items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white text-xs px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {batchDownloading ? (
                                            <><RefreshCcw className="animate-spin" size={14}/> {t.downloadingBatch}</>
                                        ) : (
                                            <><Download size={14}/> {t.batchDownload}</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Batch Action Bar (Sticky) */}
                        {isSelectionMode && selectedPhotoIds.length > 0 && (
                            <div className="sticky top-20 z-35 bg-white/90 backdrop-blur border-y border-gray-200 p-2 px-4 flex justify-between items-center shadow-sm animate-in slide-in-from-top-2">
                                <span className="text-sm font-bold text-blue-600">{t.selectedCount.replace('{n}', selectedPhotoIds.length.toString())}</span>
                                <div className="flex gap-2">
                                    {currentUser?.role === UserRole.ADMIN && (
                                        <>
                                            <button type="button" onClick={() => setIsDateEditorOpen(true)} className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition"><CalendarDays size={14}/> {t.changeDate}</button>
                                            <button type="button" onClick={() => setIsDeleteConfirmOpen(true)} className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition"><Trash2 size={14}/> {t.deleteSelected}</button>
                                        </>
                                    )}
                                    <button type="button" onClick={handleBatchDownloadSelected} disabled={batchDownloading} className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition"><Download size={14}/> {t.downloadSelected}</button>
                                </div>
                            </div>
                        )}
                        
                        {/* Grouped Photo Grid */}
                        <div className="p-4 space-y-8">
                            {groupedDates.map(date => {
                                const datePhotos = filteredPhotos.filter(p => p.date === date);
                                const dateDesc = selectedTour.itinerary?.[date] || "";

                                return (
                                    <div key={date}>
                                        {/* Date Header with Itinerary */}
                                        <div className="flex items-start gap-4 mb-3 border-b border-gray-100 pb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-md text-sm whitespace-nowrap">{date}</div>
                                            </div>
                                            <div className="flex-1 pt-1">
                                                {editingItinerary?.date === date ? (
                                                    <div className="flex gap-2">
                                                        <input 
                                                            className="flex-1 border-b border-blue-500 focus:outline-none text-sm bg-transparent" 
                                                            autoFocus
                                                            value={editingItinerary.text}
                                                            onChange={e => setEditingItinerary({...editingItinerary, text: e.target.value})}
                                                            onKeyDown={e => e.key === 'Enter' && handleSaveItineraryDescription()}
                                                            placeholder={t.itineraryPlaceholder}
                                                        />
                                                        <button onClick={handleSaveItineraryDescription} className="text-blue-600 text-xs font-bold">{t.save}</button>
                                                        <button onClick={() => setEditingItinerary(null)} className="text-gray-400 text-xs">{t.cancel}</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 group min-h-[24px]">
                                                        <span className={`text-sm ${dateDesc ? 'text-gray-800 font-medium' : 'text-gray-400 italic'}`}>
                                                            {dateDesc || (currentUser?.role === UserRole.ADMIN ? t.itineraryPlaceholder : "")}
                                                        </span>
                                                        {currentUser?.role === UserRole.ADMIN && (
                                                            <button 
                                                                onClick={() => setEditingItinerary({date, text: dateDesc})} 
                                                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition"
                                                                title={t.editItinerary}
                                                            >
                                                                <PenLine size={12}/>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Grid for this date */}
                                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
                                            {datePhotos.map(p => (
                                                <div 
                                                    key={p.id} 
                                                    onClick={() => isSelectionMode ? handleToggleSelection(p.id) : setViewingPhoto(p)} 
                                                    className={`aspect-square rounded-lg overflow-hidden bg-gray-100 relative group cursor-pointer transition ${isSelectionMode && selectedPhotoIds.includes(p.id) ? 'ring-4 ring-blue-500 scale-95' : 'hover:opacity-90'}`}
                                                >
                                                    <img src={p.url} loading="lazy" className="w-full h-full object-cover"/>
                                                    
                                                    {/* Selection Overlay */}
                                                    {isSelectionMode && (
                                                        <div className={`absolute top-2 right-2 rounded-full p-1 z-10 ${selectedPhotoIds.includes(p.id) ? 'bg-blue-600 text-white' : 'bg-white/50 text-gray-500 hover:bg-white'}`}>
                                                            {selectedPhotoIds.includes(p.id) ? <Check size={12}/> : <div className="w-3 h-3 rounded-full border border-gray-500"></div>}
                                                        </div>
                                                    )}

                                                    {/* Standard Overlay (Only if not selecting) */}
                                                    {!isSelectionMode && (
                                                        <>
                                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                                                                <div className="flex items-center gap-1 text-white text-xs font-bold">
                                                                    <Heart size={12} className="fill-white"/> {p.likes || 0}
                                                                </div>
                                                            </div>
                                                            <div className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-blue-600">
                                                            {PHOTO_CATEGORIES.find(c=>c.value === p.category)?.icon || <ImageIcon size={12}/>}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {filteredPhotos.length === 0 && (
                                <div className="col-span-full py-10 text-center text-gray-400 text-sm">
                                    {t.noPhotos}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : activeTab === 'community' ? (
                // View: Community Feed
                <div className="animate-in fade-in duration-500">
                    <div className="flex items-center justify-center mb-8">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t.community}</h2>
                            <p className="text-gray-500">{appSettings.appSlogan || t.appSlogan}</p>
                        </div>
                    </div>

                    {/* Top Photo Section */}
                    {topPhotoData?.photo && (
                        <div className="mb-10 max-w-4xl mx-auto">
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-1 shadow-sm border border-amber-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <Crown size={120} className="text-amber-500"/>
                                </div>
                                <div className="bg-white rounded-xl p-4 md:p-6 flex flex-col md:flex-row gap-6 relative z-10">
                                    <div 
                                        className="w-full md:w-1/2 h-64 md:h-80 rounded-lg overflow-hidden cursor-pointer shadow-md group relative"
                                        onClick={() => setViewingPhoto(topPhotoData.photo)}
                                    >
                                        <img src={topPhotoData.photo.url} className="w-full h-full object-cover transition duration-700 group-hover:scale-105"/>
                                        <div className="absolute top-3 left-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow flex items-center gap-1">
                                           {topPhotoData.isToday ? <Flame size={12} className="fill-white"/> : <Crown size={12} className="fill-white"/>}
                                           {topPhotoData.isToday ? t.todaysTop : t.allTimeTop}
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-2 text-amber-600 font-bold text-sm uppercase tracking-wider">
                                            <Crown size={16}/> {t.topPhotoTitle}
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-3 line-clamp-2">{topPhotoData.photo.caption}</h3>
                                        
                                        <div className="flex items-center gap-3 mb-6">
                                            {(() => {
                                                const u = users.find(user => user.id === topPhotoData.photo?.uploadedBy);
                                                return (
                                                    <div className="flex items-center gap-2">
                                                        <img src={u?.avatar} className="w-8 h-8 rounded-full border border-gray-200"/>
                                                        <span className="text-sm font-medium text-gray-700">{u?.name}</span>
                                                    </div>
                                                );
                                            })()}
                                            <span className="text-gray-300">|</span>
                                            <span className="text-sm text-gray-500">{topPhotoData.photo.date}</span>
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="flex flex-col items-center bg-red-50 text-red-600 px-5 py-3 rounded-xl min-w-[80px]">
                                                <Heart className="fill-red-500 mb-1" size={24}/>
                                                <span className="font-bold text-lg">{topPhotoData.photo.likes}</span>
                                                <span className="text-[10px] uppercase opacity-70">{t.likes}</span>
                                            </div>
                                            <div className="flex flex-col items-center bg-blue-50 text-blue-600 px-5 py-3 rounded-xl min-w-[80px]">
                                                <MessageSquare className="fill-blue-500/20 mb-1" size={24}/>
                                                <span className="font-bold text-lg">{topPhotoData.photo.comments?.length || 0}</span>
                                                <span className="text-[10px] uppercase opacity-70">{t.comments}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Category Filters (Visual Only for now) */}
                    <div className="flex justify-center gap-2 mb-8 overflow-x-auto pb-2">
                         <button className="px-4 py-1.5 bg-black text-white rounded-full text-sm font-bold whitespace-nowrap">{t.all}</button>
                         {PHOTO_CATEGORIES.map(cat => (
                           <button key={cat.value} className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-50 whitespace-nowrap flex items-center gap-1">
                             {cat.icon} {cat.label}
                           </button>
                         ))}
                    </div>

                    <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
                        {photos.map(p => (
                            <div key={p.id} onClick={() => setViewingPhoto(p)} className="break-inside-avoid bg-white rounded-xl shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition border border-gray-100">
                                <img src={p.url} className="w-full object-cover" />
                                <div className="p-3">
                                    <div className="flex justify-between items-start mb-2">
                                       <p className="text-sm font-medium text-gray-800 line-clamp-2">{p.caption}</p>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-400 text-xs mt-2">
                                        <div className="flex items-center gap-2">
                                          <div className="flex items-center gap-1"><Heart size={14} className={p.likes > 0 ? "text-red-500 fill-red-500" : ""}/> {p.likes || 0}</div>
                                          <div className="flex items-center gap-1"><MessageSquare size={14}/> {p.comments?.length || 0}</div>
                                        </div>
                                        {/* Tag Indicator */}
                                        {p.tags?.length > 0 && <div className="flex items-center gap-1 text-blue-500"><Tag size={12}/> {p.tags.length}</div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // View: My Tours List (with permission filter)
                <div className="animate-in fade-in duration-500">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <h1 className="text-2xl font-bold text-gray-900">{t.myTours}</h1>
                        <div className="flex gap-2 w-full md:w-auto">
                            {/* Search Bar for Tours */}
                            <div className="relative flex-1 md:flex-none">
                                <div className="flex items-center border bg-white rounded-xl px-3 py-2 focus-within:ring-2 ring-blue-500 w-full md:w-64">
                                    <Search size={16} className="text-gray-400 mr-2"/>
                                    <input 
                                        className="flex-1 outline-none text-sm" 
                                        placeholder={t.searchTours}
                                        value={tourSearchQuery}
                                        onChange={e => setTourSearchQuery(e.target.value)}
                                    />
                                    {tourSearchQuery && <button onClick={() => setTourSearchQuery('')} className="text-gray-400 hover:text-gray-600"><X size={14}/></button>}
                                </div>
                            </div>
                            
                            {currentUser?.role === UserRole.ADMIN && (
                                <button onClick={() => openTourEditor(null)} className="bg-black text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-gray-800 transition shadow-lg text-sm whitespace-nowrap flex-shrink-0">
                                    <Plus size={16}/> {t.newTour}
                                </button>
                            )}
                        </div>
                    </div>

                    {visibleTours.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <MapPin className="mx-auto mb-3 opacity-20" size={48}/>
                            <p>{t.noResults}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {visibleTours.map(tour => (
                                <div key={tour.id} onClick={() => {setSelectedTourId(tour.id); setFilterCategory(null); setFilterDate(null); setFilterUser(null); setFilterTaggedUser(null); setIsSelectionMode(false);}} className="bg-white rounded-xl shadow-sm hover:shadow-lg cursor-pointer overflow-hidden border border-gray-100 group transition-all duration-300">
                                    <div className="h-48 overflow-hidden relative">
                                        <img src={tour.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/>
                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold shadow-sm flex items-center gap-1">
                                            <Calendar size={12}/> {tour.duration}
                                        </div>
                                        {currentUser?.role === UserRole.ADMIN && (
                                            <div className="absolute top-3 left-3 flex gap-1">
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteTourClick(tour); }} className="bg-red-500/80 text-white p-1.5 rounded-full hover:bg-red-600 transition shadow-sm z-10">
                                                <Trash2 size={12}/>
                                            </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-lg mb-1 group-hover:text-blue-600 transition-colors">{tour.name}</h3>
                                        <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
                                            <MapPin size={12}/> {tour.destination}
                                        </div>
                                        <div className="flex -space-x-2 overflow-hidden py-1">
                                            {[1,2,3,4].map(i => <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-gray-200" />)}
                                            <div className="flex items-center justify-center h-6 w-6 rounded-full ring-2 ring-white bg-gray-100 text-[10px] text-gray-500 font-bold">+12</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </main>
        
        <ChatWidget language={language} currentDestination={selectedTour?.destination} />

        {/* Date Editor Modal */}
        {isDateEditorOpen && (
            <Modal onClose={() => setIsDateEditorOpen(false)} title={t.changeDate}>
                <div className="p-6">
                    <p className="mb-4 text-sm text-gray-600">Select new date for {selectedPhotoIds.length} photos:</p>
                    <input type="date" className="w-full border p-2 rounded-lg mb-6" value={batchDate} onChange={e => setBatchDate(e.target.value)} />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsDateEditorOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">{t.cancel}</button>
                        <button onClick={handleBatchDateUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{t.updateDate}</button>
                    </div>
                </div>
            </Modal>
        )}

        {/* Cover Selector Modal (NEW) */}
        {isCoverSelectorOpen && (
            <Modal onClose={() => setIsCoverSelectorOpen(false)} title={t.selectCoverTitle}>
                <div className="p-4">
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {filteredPhotos.map(p => (
                            <div key={p.id} onClick={() => handleSelectCoverFromAlbum(p.url)} className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-4 hover:ring-blue-500 transition relative group">
                                <img src={p.url} className="w-full h-full object-cover" loading="lazy" />
                                {selectedTour?.coverImage === p.url && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <Check className="text-white w-8 h-8"/>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {filteredPhotos.length === 0 && (
                        <div className="text-center py-10 text-gray-400">{t.noPhotos}</div>
                    )}
                </div>
            </Modal>
        )}

        {/* Delete Confirmation Modal (Photos) */}
        {isDeleteConfirmOpen && (
            <Modal onClose={() => setIsDeleteConfirmOpen(false)} title={t.delete}>
                <div className="p-6">
                    <div className="flex flex-col items-center justify-center text-center mb-6">
                        <div className="bg-red-100 p-3 rounded-full mb-4">
                            <AlertCircle className="text-red-600" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {t.confirmBatchDelete.replace('{n}', selectedPhotoIds.length.toString())}
                        </h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                           {t.deleteWarning}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button disabled={isDeleting} onClick={() => setIsDeleteConfirmOpen(false)} className="flex-1 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition disabled:opacity-50">
                            {t.cancel}
                        </button>
                        <button disabled={isDeleting} onClick={handleBatchDelete} className="flex-1 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-xl font-bold shadow-md transition flex justify-center items-center gap-2 disabled:opacity-50">
                            {isDeleting ? <Loader2 className="animate-spin" size={18}/> : <Trash2 size={18}/>} {isDeleting ? t.deleting : t.delete}
                        </button>
                    </div>
                </div>
            </Modal>
        )}

        {/* Tour Delete Confirmation Modal (NEW) */}
        {tourToDelete && (
            <Modal onClose={() => setTourToDelete(null)} title={t.delete}>
                <div className="p-6">
                    <div className="flex flex-col items-center justify-center text-center mb-6">
                        <div className="bg-red-100 p-3 rounded-full mb-4">
                            <AlertCircle className="text-red-600" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {t.confirmTourDelete.replace('{name}', tourToDelete.name)}
                        </h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                           {t.tourDeleteWarning}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button disabled={isDeleting} onClick={() => setTourToDelete(null)} className="flex-1 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition disabled:opacity-50">
                            {t.cancel}
                        </button>
                        <button disabled={isDeleting} onClick={confirmDeleteTour} className="flex-1 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-xl font-bold shadow-md transition flex justify-center items-center gap-2 disabled:opacity-50">
                            {isDeleting ? <Loader2 className="animate-spin" size={18}/> : <Trash2 size={18}/>} {isDeleting ? t.deleting : t.delete}
                        </button>
                    </div>
                </div>
            </Modal>
        )}

        {viewingPhoto && currentUser && (
            <PhotoLightbox 
                photo={viewingPhoto} 
                user={currentUser} 
                users={users} 
                onClose={() => setViewingPhoto(null)} 
                onUpdate={handlePhotoUpdate} 
                onLike={handleLike}
                onComment={handleComment} 
                t={t}
            />
        )}

        {isEditorOpen && (
            <TourEditorModal tour={editorTour} users={users} onClose={() => setIsEditorOpen(false)} onSave={handleSaveTour} t={t} />
        )}

        {isProfileOpen && currentUser && (
          <Modal onClose={() => setIsProfileOpen(false)} title={t.profile}>
            <div className="text-center p-6">
              
              <div className="relative inline-block mb-4 group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-500 mx-auto relative">
                    <img src={currentUser.avatar} className="w-full h-full object-cover" />
                    {avatarUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-white"/></div>}
                    {!avatarUploading && (
                        <label className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity" title={t.uploadAvatar}>
                            <Camera className="text-white" size={24}/>
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </label>
                    )}
                </div>
              </div>

              <h3 className="font-bold text-xl">{currentUser.name}</h3>
              <p className="text-gray-500">{currentUser.phoneNumber}</p>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-2 inline-block">{currentUser.role}</span>
              <div className="mt-4 text-xs text-gray-400">ID: {currentUser.id}</div>
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                  <button onClick={() => { setIsProfileOpen(false); setIsChangePasswordOpen(true); }} className="w-full py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-bold text-gray-700 transition flex items-center justify-center gap-2">
                      <KeyRound size={16}/> {t.changePwd}
                  </button>
              </div>
            </div>
          </Modal>
        )}

        {isChangePasswordOpen && currentUser && (
            <ChangePasswordModal 
                currentUser={currentUser} 
                onClose={() => setIsChangePasswordOpen(false)} 
                t={t} 
            />
        )}

        {isSiteSettingsOpen && (
            <SiteSettingsModal 
                currentSettings={appSettings} 
                onClose={() => setIsSiteSettingsOpen(false)} 
                onSave={handleSaveSiteSettings} 
                t={t} 
            />
        )}

        {isUserManagementOpen && (
          <Modal onClose={() => setIsUserManagementOpen(false)} title={t.userMgmt}>
            <div className="p-4 flex flex-col h-full max-h-[80vh]">
                <div className="flex justify-between items-center mb-4">
                     <p className="text-sm text-gray-500">{t.userMgmtDesc || "管理系统内所有用户"}</p>
                     <button onClick={() => { setEditingUser(null); setIsUserEditorOpen(true); }} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 shadow hover:bg-blue-700 transition">
                        <UserPlus size={16}/> {t.addUser}
                     </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {users.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition">
                      <div className="flex items-center gap-3">
                          <img src={u.avatar} className="w-10 h-10 rounded-full border bg-white"/>
                          <div>
                              <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                  {u.name} 
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${u.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                    {u.role === UserRole.ADMIN ? t.admin : t.customer}
                                  </span>
                              </div>
                              <div className="text-xs text-gray-400 font-mono">{u.phoneNumber} | {u.id}</div>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <button onClick={() => { setEditingUser(u); setIsUserEditorOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title={t.edit}>
                              <Edit3 size={16}/>
                          </button>
                          <button onClick={() => handleResetPassword(u.id)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition" title={t.resetPwd}>
                              <RefreshCcw size={16}/>
                          </button>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
          </Modal>
        )}

        {/* User Editor Modal moved here to be on top of User Management */}
        {isUserEditorOpen && (
            <UserEditorModal 
                user={editingUser} 
                onClose={() => setIsUserEditorOpen(false)} 
                onSave={handleSaveUser} 
                t={t} 
            />
        )}
    </div>
  );
}