import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Rocket } from 'lucide-react';

const Landing = () => {
  return (
    <>
      <style>{`
        .landing-wrapper {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background-color: #02040a;
          perspective: 1000px;
        }

        /* Continuous scrolling starfield */
        .star-layer {
          position: absolute;
          top: -50%; left: -50%; right: -50%; bottom: -50%;
          background-repeat: repeat;
          z-index: 0;
        }

        .layer-1 {
          background-size: 200px 200px;
          background-image: radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.8), rgba(0,0,0,0)), radial-gradient(1px 1px at 90px 40px, #ffffff, rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 160px 120px, rgba(255,255,255,0.9), rgba(0,0,0,0));
          animation: move-stars 60s linear infinite;
        }

        .layer-2 {
          background-size: 300px 300px;
          background-image: radial-gradient(2px 2px at 50px 160px, rgba(255,255,255,0.9), rgba(0,0,0,0)), radial-gradient(2px 2px at 90px 40px, rgba(255,255,255,0.7), rgba(0,0,0,0)), radial-gradient(1.5px 1.5px at 130px 280px, rgba(255,255,255,0.8), rgba(0,0,0,0));
          animation: move-stars 40s linear infinite;
        }

        .layer-3 {
          background-size: 400px 400px;
          background-image: radial-gradient(2.5px 2.5px at 120px 140px, #ffffff, rgba(0,0,0,0)), radial-gradient(2px 2px at 300px 200px, rgba(255,255,255,0.6), rgba(0,0,0,0));
          animation: move-stars 25s linear infinite;
        }

        @keyframes move-stars {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(-500px) translateX(-500px); }
        }

        /* Swirling Cosmic Galaxy */
        .galaxy-spiral {
          position: absolute;
          top: 30%;
          left: 50%;
          width: 140vw;
          height: 140vw;
          margin-left: -70vw;
          margin-top: -70vw;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(139, 92, 246, 0.15) 30deg,
            transparent 90deg,
            transparent 180deg,
            rgba(56, 189, 248, 0.15) 210deg,
            transparent 270deg,
            transparent 360deg
          );
          filter: blur(50px);
          animation: spiral-spin 50s linear infinite;
          z-index: 0;
          pointer-events: none;
        }

        .galaxy-core {
          position: absolute;
          top: 30%;
          left: 50%;
          width: 30vw;
          height: 30vw;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(139, 92, 246, 0.1) 40%, transparent 70%);
          filter: blur(30px);
          z-index: 0;
          pointer-events: none;
          animation: breath 6s ease-in-out infinite alternate;
        }

        @keyframes spiral-spin {
          from { transform: rotateX(65deg) rotate(0deg); }
          to { transform: rotateX(65deg) rotate(360deg); }
        }
        
        @keyframes breath {
          0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
        }

        /* Majestic Planetary Ring */
        .planetary-ring {
          position: absolute;
          top: 40%;
          left: 50%;
          width: 250vw;
          height: 250vw;
          transform: translate(-50%, -50%) rotateX(78deg);
          border-radius: 50%;
          /* Removed sharp border to prevent dotted aliasing; using pure smooth shadow */
          box-shadow: 
            0 0 60px 15px rgba(139, 92, 246, 0.2),
            inset 0 0 80px 20px rgba(56, 189, 248, 0.2);
          z-index: -1;
          pointer-events: none;
        }

        /* Nebula Glow */
        .nebula {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: 
            radial-gradient(ellipse at 20% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(56, 189, 248, 0.1) 0%, transparent 50%);
          z-index: 0;
          animation: nebula-pulse 10s ease-in-out infinite alternate;
          pointer-events: none;
        }

        @keyframes nebula-pulse {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }

        /* Stable Planet */
        .planet-container {
          position: absolute;
          bottom: -60vh;
          left: 50%;
          transform: translateX(-50%);
          width: 180vw;
          height: 100vh;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 40%, #02040a 80%);
          box-shadow: 
            0 -20px 100px rgba(139, 92, 246, 0.3), 
            0 -2px 10px rgba(56, 189, 248, 0.4),
            inset 0 10px 50px rgba(0, 0, 0, 0.8),
            inset 0 2px 20px rgba(255, 255, 255, 0.1);
          z-index: 2;
          display: flex;
          justify-content: center;
        }
        
        .planet-texture {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-image: 
            radial-gradient(circle at 40% 10%, rgba(0,0,0,0.2) 0%, transparent 10%),
            radial-gradient(circle at 60% 20%, rgba(0,0,0,0.1) 0%, transparent 15%),
            radial-gradient(circle at 20% 15%, rgba(0,0,0,0.15) 0%, transparent 8%);
          opacity: 0.8;
        }

        .planet-atmosphere {
          position: absolute;
          top: -20px;
          left: -5%;
          right: -5%;
          bottom: 50%;
          border-radius: 50% 50% 0 0 / 100% 100% 0 0;
          background: linear-gradient(to bottom, rgba(56, 189, 248, 0.2), transparent);
          z-index: 3;
          pointer-events: none;
        }

        /* UI Content */
        .hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 100vh;
          padding: 2rem;
          position: relative;
          z-index: 10;
        }

        .badge-space {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(139, 92, 246, 0.5);
          color: #e2e8f0;
          padding: 0.6rem 1.75rem;
          border-radius: 9999px;
          font-weight: 500;
          font-size: 0.95rem;
          margin-bottom: 2.5rem;
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          box-shadow: 0 0 30px rgba(139, 92, 246, 0.3);
          animation: zero-g-float 8s ease-in-out infinite;
        }

        @keyframes zero-g-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(1deg); }
          75% { transform: translateY(8px) rotate(-1deg); }
        }

        .hero h1 {
          font-size: clamp(3.5rem, 8vw, 7rem);
          font-weight: 800;
          letter-spacing: -0.05em;
          line-height: 1;
          margin-bottom: 1.5rem;
          color: #ffffff;
          text-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
        }

        .hero h1 span {
          background: linear-gradient(to bottom right, #ffffff, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero p {
          font-size: clamp(1.1rem, 3vw, 1.4rem);
          color: #94a3b8;
          max-width: 650px;
          margin: 0 auto 3.5rem;
          line-height: 1.7;
          font-weight: 300;
        }

        .hero-buttons {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .btn-large {
          padding: 1.25rem 3rem;
          font-size: 1.15rem;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .btn-primary {
          background: #e0e7ff;
          color: #0f172a;
          border: none;
          box-shadow: 0 0 20px rgba(224, 231, 255, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 0 40px rgba(224, 231, 255, 0.8);
          background: #ffffff;
        }

        .btn-outline {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          backdrop-filter: blur(8px);
        }

        .btn-outline:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.6);
          transform: translateY(-3px);
        }
      `}</style>
      
      <div className="landing-wrapper">
        {/* Continuous moving starfield */}
        <div className="star-layer layer-1"></div>
        <div className="star-layer layer-2"></div>
        <div className="star-layer layer-3"></div>
        
        {/* Cosmics / Nebula overlay */}
        <div className="nebula"></div>
        
        {/* Supermassive Black Hole / Galaxy Swirl */}
        <div className="galaxy-spiral"></div>
        <div className="galaxy-core"></div>
        
        {/* Stable massive planetary horizon with Rings */}
        <div className="planet-container">
          <div className="planetary-ring"></div>
          <div className="planet-texture"></div>
          <div className="planet-atmosphere"></div>
        </div>

        {/* Floating UI over the cosmos */}
        <div className="hero animate-fade-in">
          <div className="badge-space">
            <Rocket size={18} /> Launch Sequence Initiated
          </div>
          
          <h1>
            Welcome to <br />
            <span>LearnifyX</span>
          </h1>
          
          <p>
            Board the most advanced AI-powered examination platform. Fast, secure, and designed to launch your grades into orbit.
          </p>
          
          <div className="hero-buttons">
            <Link to="/register" className="btn-large btn-primary">
              Begin Journey <ArrowRight size={22} />
            </Link>
            <Link to="/login" className="btn-large btn-outline">
              Sign In
            </Link>
            <Link to="/admin-login" className="btn-large btn-outline" style={{ borderColor: 'rgba(139, 92, 246, 0.4)', color: '#c084fc' }}>
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Landing;
