const fs = require('fs');
const path = require('path');

const filePath = 'E:\\Alanove\\VS Code\\Bloomina_dashboard\\src\\pages\\admin\\AdminProducts.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const header = `import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Filter, Upload, Download, MoreHorizontal, Edit, Trash2, Image as ImageIcon, X, Save, ArrowLeft, ChevronDown, Check, DollarSign, Box, Tag, Layers, Settings2, CheckCircle, AlertCircle, RefreshCw, ArrowUpDown, Ruler, Palette } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAlert } from '../../contexts/AlertContext';

const CustomDropdown = ({ options, value, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
`;

// Check if it's already there
if (!content.trim().startsWith('import React')) {
    console.log('Prepending header...');
    content = header + content;
    fs.writeFileSync(filePath, content);
    console.log('File fixed successfully.');
} else {
    console.log('Header already exists.');
}
