import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInWithPopup, signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Helmet } from 'react-helmet-async';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || null;
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [teacherConsent, setTeacherConsent] = useState(false);

  // Phone OTP state
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const recaptchaVerifierRef = useRef(null);

  // Initialize invisible reCAPTCHA
  useEffect(() => {
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          setError('reCAPTCHA expired. Please try again.');
        }
      });
    }
  }, []);

  // ---------- Sync user to backend + redirect ----------
  const syncAndRedirect = async (firebaseUser, role) => {
    try {
      setSyncing(true);
      setError('');

      const payload = {
        firebaseUid: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.phoneNumber || '',
        email: firebaseUser.email || '',
        phone: firebaseUser.phoneNumber || '',
        photoURL: firebaseUser.photoURL || '',
        role,
      };

      console.log('Syncing user to backend:', payload);

      const res = await fetch(`${import.meta.env.DEV ? 'http://localhost:5000' : import.meta.env.VITE_API_URL}/api/users/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to sync user.');
      }

      const savedUser = await res.json();
      console.log('User saved to DB:', savedUser);

      // If user was trying to visit a protected page, redirect there instead
      if (redirectTo) {
        navigate(redirectTo, { replace: true });
      } else if (role === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/teacher/dashboard');
      }
    } catch (err) {
      console.error('Sync error:', err);
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  // ---------- Google Sign-In ----------
  const handleGoogleSignIn = async () => {
    try {
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google Sign-In successful:', result.user);
      setUser(result.user);
    } catch (err) {
      console.error('Google Sign-In error:', err);
      setError(err.message);
    }
  };

  // ---------- Phone OTP ----------
  const handleSendOTP = async () => {
    const fullPhone = `+91${phone.replace(/\s/g, '')}`;

    if (phone.replace(/\s/g, '').length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      setError('');
      setSending(true);
      const result = await signInWithPhoneNumber(auth, fullPhone, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setOtpSent(true);
      console.log('OTP sent to', fullPhone);
    } catch (err) {
      console.error('Send OTP error:', err);
      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch (_) { /* ignore */ }
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    try {
      setError('');
      setVerifying(true);
      const result = await confirmationResult.confirm(otp);
      console.log('Phone Sign-In successful:', result.user);
      setUser(result.user);
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError('Invalid OTP. Please check and try again.');
    } finally {
      setVerifying(false);
    }
  };

  // ---------- UI ----------
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 sm:p-6 lg:p-8">
      <Helmet>
        <title>Login | Kota Tuition Hub</title>
        <meta name="description" content="Sign in to Kota Tuition Hub to find or offer home tuition in Kota, Rajasthan." />
      </Helmet>
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-md text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Welcome</h1>
        <p className="text-gray-500 mb-8">Sign in to Kota Tuition Hub</p>

        {!user ? (
          <>
            {/* ===== Google Sign-In ===== */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-3.5 sm:py-3 text-gray-700 font-medium hover:bg-gray-50 hover:shadow transition-all cursor-pointer min-h-[44px]"
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Continue with Google
            </button>

            {/* ===== TEMPORARILY HIDDEN PHONE LOGIN ===== */}
            {false && (
              <>
                {/* ===== Divider ===== */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="text-sm text-gray-400 font-medium">OR</span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                {/* ===== Phone + OTP ===== */}
                {!otpSent ? (
                  <div>
                    <label className="block text-left text-sm font-medium text-gray-600 mb-1">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <span className="flex items-center justify-center px-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 text-sm font-medium">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Enter 10-digit number"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-3 text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <button
                      onClick={handleSendOTP}
                      disabled={sending || phone.length < 10}
                      className="w-full mt-3 bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sending ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-green-600 mb-3">
                      OTP sent to +91 {phone}
                    </p>
                    <label className="block text-left text-sm font-medium text-gray-600 mb-1">
                      Enter 6-digit OTP
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="w-full border border-gray-300 rounded-lg px-3 py-3 text-center text-xl tracking-[0.5em] text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                    />
                    <button
                      onClick={handleVerifyOTP}
                      disabled={verifying || otp.length < 6}
                      className="w-full mt-3 bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {verifying ? 'Verifying...' : 'Verify OTP'}
                    </button>
                    <button
                      onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
                      className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
                    >
                      ← Change phone number
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ===== Error Message ===== */}
            {error && (
              <p className="mt-4 text-red-500 text-sm bg-red-50 rounded-lg p-3 border border-red-200">
                {error}
              </p>
            )}
          </>
        ) : (
          /* ===== Logged-In — Role Selection ===== */
          <div>
            <div className="flex items-center gap-3 mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {(user.displayName || user.phoneNumber || '?')[0]}
                </div>
              )}
              <div className="text-left flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">
                  Logged in as {user.displayName || user.phoneNumber}
                </p>
                <p className="text-sm text-gray-500 truncate">{user.email || user.phoneNumber}</p>
              </div>
            </div>

            <div className="text-left mb-8">
              <p className="text-ink font-semibold mb-3">Continue as Student</p>
              <button
                onClick={() => syncAndRedirect(user, 'student')}
                disabled={syncing}
                className="w-full bg-ink text-sandstone rounded-xl py-3.5 font-medium hover:bg-ink/90 transition-all shadow-sm active:translate-y-0 disabled:opacity-50"
              >
                {syncing ? 'Saving...' : 'Proceed to Student Dashboard'}
              </button>
            </div>

            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 h-px bg-ink/10"></div>
              <span className="text-sm font-medium text-ink/40 tracking-wider uppercase">or register as</span>
              <div className="flex-1 h-px bg-ink/10"></div>
            </div>

            <div className="text-left">
              <p className="text-ink font-semibold mb-3">Continue as Teacher</p>
              
              {/* Teacher Consent Box */}
              <div className="bg-sandstone border border-ink/10 rounded-xl p-3.5 sm:p-4 mb-4">
                <p className="text-xs text-ink/70 leading-relaxed mb-4 font-body">
                  By registering as a teacher on Kota Tuition Hub, you agree that the platform charges a <strong className="text-ink">20% commission</strong> on the tuition fee for every student successfully converted through this platform. This commission is payable to Kota Tuition Hub as per the terms of use.
                </p>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={teacherConsent}
                    onChange={(e) => setTeacherConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-marigold rounded border-ink/20 focus:ring-marigold transition-colors cursor-pointer"
                  />
                  <span className="text-xs font-medium text-ink/80 group-hover:text-ink transition-colors select-none leading-tight">
                    I have read and agree to the above commission terms
                  </span>
                </label>
              </div>

              <button
                onClick={() => syncAndRedirect(user, 'teacher')}
                disabled={syncing || !teacherConsent}
                className="w-full bg-marigold text-ink rounded-xl py-3.5 font-semibold hover:bg-marigold/90 transition-all shadow-sm shadow-marigold/20 disabled:opacity-40 disabled:hover:bg-marigold disabled:hover:translate-y-0 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {syncing ? 'Saving...' : 'Register as Teacher'}
              </button>
            </div>

            {error && (
              <p className="mt-4 text-red-500 text-sm bg-red-50 rounded-lg p-3 border border-red-200">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Invisible reCAPTCHA container */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}

export default Login;
