import React, { createContext, useContext, useState, useCallback } from 'react';
import UniversalAlert from '../components/admin/UniversalAlert';

const AlertContext = createContext();

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

export const AlertProvider = ({ children }) => {
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "danger",
        confirmText: "Confirm",
        cancelText: "Cancel",
        onConfirm: () => {},
        showCancel: true,
        showInput: false,
        inputType: "text",
        placeholder: "",
        defaultValue: ""
    });

    const showAlert = useCallback((config) => {
        setAlertConfig({
            isOpen: true,
            title: config.title || "Are you sure?",
            message: config.message || "",
            type: config.type || "danger",
            confirmText: config.confirmText || "Confirm",
            cancelText: config.cancelText || "Cancel",
            onConfirm: config.onConfirm || (() => {}),
            showCancel: config.showCancel !== undefined ? config.showCancel : true,
            showInput: config.showInput || false,
            inputType: config.inputType || "text",
            placeholder: config.placeholder || "",
            defaultValue: config.defaultValue || ""
        });
    }, []);

    const hideAlert = useCallback(() => {
        setAlertConfig(prev => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <UniversalAlert 
                {...alertConfig} 
                onClose={hideAlert} 
                onConfirm={async (value) => {
                    await alertConfig.onConfirm(value);
                    hideAlert();
                }}
            />
        </AlertContext.Provider>
    );
};

