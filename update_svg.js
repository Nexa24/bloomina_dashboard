import fs from 'fs';

const b64White = fs.readFileSync('src/assets/Bloomina_transparent.png').toString('base64');
const embedImg = 'data:image/png;base64,' + b64White; // Contains the Bloomina White logo

let svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%" style="background:transparent; display:block; margin:auto;">
  <defs>
    <style>
      /* Smooth Entry */
      @keyframes boxDrop {
        0% { transform: translateY(-100px) scale(0.8); opacity: 0; }
        40% { transform: translateY(20px) scale(1.05); opacity: 1; }
        65% { transform: translateY(-5px) scale(0.98); opacity: 1; }
        100% { transform: translateY(0px) scale(1); opacity: 1; }
      }
      @keyframes shadowDrop {
        0% { transform: scale(0.2); opacity: 0; }
        40% { transform: scale(1.1); opacity: 0.15; }
        65% { transform: scale(0.95); opacity: 0.2; }
        100% { transform: scale(1); opacity: 0.2; }
      }
      
      /* Tape application (Tape sliding across seam) */
      @keyframes tapeRoll {
        0% { transform: scale(0); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }

      /* Label Slapping On */
      @keyframes labelIn {
        0% { transform: translateY(-40px) scale(1.1) rotate(5deg); opacity: 0; filter: drop-shadow(0 10px 10px rgba(0,0,0,0.2)); }
        100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; filter: drop-shadow(0 0 0 transparent); }
      }

      /* Morph out */
      @keyframes boxExit {
        0% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 0 transparent); }
        30% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 15px 25px rgba(27,79,156, 0.4)); }
        100% { transform: scale(0.2); opacity: 0; }
      }
      @keyframes shadowExit {
        0% { transform: scale(1); opacity: 0.2; }
        100% { transform: scale(0.2); opacity: 0; }
      }

      /* Checkmark Pop */
      @keyframes checkPop {
        0% { transform: scale(0); opacity: 0; }
        60% { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes drawStroke {
        to { stroke-dashoffset: 0; }
      }

      /* Element Assignments */
      .box-group {
        transform-origin: 0px 50px;
        animation: boxDrop 0.9s cubic-bezier(0.25, 1, 0.5, 1) forwards,
                   boxExit 0.5s 3.5s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards;
      }
      .shadow-group {
        transform-origin: 0px 0px;
        animation: shadowDrop 0.9s cubic-bezier(0.25, 1, 0.5, 1) forwards,
                   shadowExit 0.5s 3.5s cubic-bezier(0.6, -0.28, 0.735, 0.045) forwards;
      }
      .tape-anim {
        transform-origin: -40px -60px;
        opacity: 0;
        animation: tapeRoll 0.3s 1.6s ease-out forwards;
      }
      .label-group {
        transform-origin: 0px -40px;
        opacity: 0;
        animation: labelIn 0.4s 1.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      .check-group {
        transform-origin: 0px 0px;
        opacity: 0;
        animation: checkPop 0.6s 3.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      .stroke-anim {
        stroke-dasharray: 100;
        stroke-dashoffset: 100;
        animation: drawStroke 0.6s 4.1s ease-out forwards;
      }
    </style>

    <!-- Flat Premium Blue Colors matching standard modern box design -->
    <linearGradient id="bodyLeft" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E65B3" />
      <stop offset="100%" stop-color="#165296" />
    </linearGradient>
    <linearGradient id="bodyRight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#165296" />
      <stop offset="100%" stop-color="#0F3C73" />
    </linearGradient>
    
    <linearGradient id="interiorBot" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#071933" />
      <stop offset="100%" stop-color="#040F1F" />
    </linearGradient>
    
    <!-- Flap Gradients -->
    <linearGradient id="flapNE" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#165296" />
      <stop offset="100%" stop-color="#0F3C73" />
    </linearGradient>
    <linearGradient id="flapSW" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2D7ECA" />
      <stop offset="100%" stop-color="#1E65B3" />
    </linearGradient>

    <!-- Premium Check Accent -->
    <linearGradient id="checkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2ECC71" />
      <stop offset="100%" stop-color="#229954" />
    </linearGradient>

    <!-- Drop Shadow for the Success Checkmark -->
    <filter id="checkShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="8" flood-color="#229954" flood-opacity="0.5" />
    </filter>
  </defs>

  <g transform="translate(200, 260)">
    <g class="shadow-group">
      <ellipse cx="0" cy="0" rx="110" ry="52" fill="#CBD5E1" opacity="0.6" />
    </g>
  </g>

  <g transform="translate(200, 150)">
    <g class="box-group">
      
      <!-- Deep Interior Bottom -->
      <path d="M -80 50 L 0 10 L 80 50 L 0 90 Z" fill="url(#interiorBot)" stroke="#040F1F" stroke-width="0.5" stroke-linejoin="round" />
      
      <!-- Deep Interior Walls -->
      <path d="M -80 -40 L 0 -80 L 0 10 L -80 50 Z" fill="#0A2447" stroke="#040F1F" stroke-width="0.5" stroke-linejoin="round" />
      <path d="M 0 -80 L 80 -40 L 80 50 L 0 10 Z" fill="#061833" stroke="#040F1F" stroke-width="0.5" stroke-linejoin="round" />

      <!-- Static Small Flaps - Dark Blue -->
      <path d="M -80 -40 L 0 -80 L 20 -70 L -60 -30 Z" fill="#165296" />
      <path d="M 0 0 L 80 -40 L 60 -50 L -20 -10 Z" fill="#0F3C73" />

      <!-- Exterior Front Left Face -->
      <path d="M -80 -40 L 0 0 L 0 90 L -80 50 Z" fill="url(#bodyLeft)" />
      
      <!-- Perfectly Mapped Logo -->
      <g transform="translate(-40, 25) skewY(26.565) scale(0.894, 1)">
        <image href="${embedImg}" x="-36" y="-36" width="72" height="72" preserveAspectRatio="xMidYMid meet" opacity="0.95" />
      </g>
      
      <!-- Border lines for crisp box edges -->
      <path d="M -80 -40 L 0 0 L 0 90 L -80 50 Z" fill="none" stroke="#3A90DD" stroke-width="1.2" stroke-linejoin="round" opacity="0.8" />

      <!-- Exterior Front Right Face -->
      <path d="M 0 0 L 80 -40 L 80 50 L 0 90 Z" fill="url(#bodyRight)" />
      <path d="M 0 0 L 80 -40 L 80 50 L 0 90 Z" fill="none" stroke="#2D7ECA" stroke-width="1.2" stroke-linejoin="round" opacity="0.8" />
      
      <!-- Center crease highlight -->
      <line x1="0" y1="0" x2="0" y2="90" stroke="#63B3ED" stroke-width="1.5" stroke-linecap="round" />

      <!-- Animated Flap NE (Back-Right) - Folds First -->
      <path fill="url(#flapNE)" stroke="#226BB3" stroke-width="1.2" stroke-linejoin="round">
        <animate attributeName="d" 
                 begin="0.9s" dur="0.4s" 
                 fill="freeze"
                 calcMode="spline" keyTimes="0;1" keySplines="0.25 1 0.5 1"
                 from="M 0 -80 L 80 -40 L 80 -100 L 0 -140 Z" 
                 to="M 0 -80 L 80 -40 L 40 -20 L -40 -60 Z" />
      </path>

      <!-- Animated Flap SW (Front-Left) - Folds Second -->
      <!-- This flap rests on top of the back-right flap -->
      <path fill="url(#flapSW)" stroke="#3A90DD" stroke-width="1.2" stroke-linejoin="round">
        <animate attributeName="d" 
                 begin="1.2s" dur="0.4s" 
                 fill="freeze"
                 calcMode="spline" keyTimes="0;1" keySplines="0.25 1 0.5 1"
                 from="M -80 -40 L 0 0 L 0 -60 L -80 -100 Z" 
                 to="M -80 -40 L 0 0 L 40 -20 L -40 -60 Z" />
      </path>

      <!-- Translucent Packing Tape sliding across seam -->
      <g class="tape-anim">
        <!-- Glossy Tape Base -->
        <path d="M -28 -66 L 52 -26 L 28 -14 L -52 -54 Z" fill="#F8FAFC" opacity="0.6" />
        <path d="M -28 -66 L 52 -26 L 28 -14 L -52 -54 Z" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.4" stroke-linejoin="round" />
        <!-- Tape Texture -->
        <line x1="-40" y1="-60" x2="40" y2="-20" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="4,6" stroke-linecap="round" />
      </g>

      <!-- Shipping Label Slaps On Top -->
      <g class="label-group">
        <!-- Label perfectly centered on top plane -->
        <g transform="translate(0, -40) matrix(0.866, 0.5, -0.866, 0.5, 0, 0)">
          <!-- White Ticket -->
          <rect x="-30" y="-18" width="60" height="36" fill="#FFFFFF" rx="2" stroke="#E2E8F0" stroke-width="0.5" />
          <!-- Header Bar -->
          <rect x="-30" y="-18" width="60" height="8" fill="#1E65B3" rx="2" />
          <rect x="-30" y="-14" width="60" height="4" fill="#1E65B3" />
          <!-- Big Bold Tracking Number Text simulation -->
          <rect x="-24" y="-3" width="24" height="4" fill="#0F172A" rx="1.5" />
          <rect x="6" y="-3" width="18" height="4" fill="#64748B" rx="1.5" />
          <!-- Barcode Lines -->
          <rect x="-24" y="4" width="2" height="10" fill="#0F172A" />
          <rect x="-19" y="4" width="4" height="10" fill="#0F172A" />
          <rect x="-12" y="4" width="1" height="10" fill="#0F172A" />
          <rect x="-8" y="4" width="3" height="10" fill="#0F172A" />
          <rect x="-2" y="4" width="2" height="10" fill="#0F172A" />
          <rect x="3" y="4" width="4" height="10" fill="#0F172A" />
          <rect x="10" y="4" width="1" height="10" fill="#0F172A" />
          <rect x="14" y="4" width="2" height="10" fill="#0F172A" />
          <rect x="19" y="4" width="5" height="10" fill="#0F172A" />
          <rect x="27" y="4" width="1" height="10" fill="#0F172A" />
        </g>
      </g>
    </g>
  </g>

  <g transform="translate(200, 180)">
    <!-- Final Success Checkmark -->
    <g class="check-group">
      <circle cx="0" cy="0" r="70" fill="url(#checkGrad)" filter="url(#checkShadow)" />
      <circle cx="0" cy="0" r="65" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.4" />

      <path class="stroke-anim" 
            d="M -24 5 L -8 21 L 28 -15" 
            fill="none" 
            stroke="#ffffff" 
            stroke-width="12" 
            stroke-linecap="round" 
            stroke-linejoin="round" />
    </g>
  </g>
</svg>
`;

fs.writeFileSync('src/assets/order.svg', svg);

