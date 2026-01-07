import Layout from "./Layout.jsx";

import Calendar from "./Calendar";

import Dashboard from "./Dashboard";

import Home from "./Home";

import LessonView from "./LessonView";

import Profile from "./Profile";

import QuizView from "./QuizView";

import Resources from "./Resources";

import VideoView from "./VideoView";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Calendar: Calendar,
    
    Dashboard: Dashboard,
    
    Home: Home,
    
    LessonView: LessonView,
    
    Profile: Profile,
    
    QuizView: QuizView,
    
    Resources: Resources,
    
    VideoView: VideoView,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Calendar />} />
                
                
                <Route path="/Calendar" element={<Calendar />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/LessonView" element={<LessonView />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/QuizView" element={<QuizView />} />
                
                <Route path="/Resources" element={<Resources />} />
                
                <Route path="/VideoView" element={<VideoView />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}