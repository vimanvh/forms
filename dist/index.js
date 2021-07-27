"use strict";
/**
 *  Library for building forms
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormCollection = exports.Form = void 0;
const mobx_1 = require("mobx");
/**
 * Form
 */
class Form {
    constructor(options, parent) {
        this.options = options;
        this.parent = parent;
        this._fields = {};
        this._validated = false;
        this._readOnly = false;
        this._subForms = [];
        /**
         * Set default values for all fields
         */
        this.setDefaultFields = () => {
            for (let i in this.options.fields) {
                this._fields[i] = {
                    value: this.options.fields[i].defaultValue,
                    validation: ""
                };
            }
        };
        this.handleChangeForm = () => {
            const onChangeForm = this.options.onChangeForm;
            if (onChangeForm) {
                onChangeForm(this);
            }
        };
        /**
         * Vrací zda je hodnota pouze pro čtení
         */
        this.isFieldReadOnly = (field) => {
            var _a;
            const fieldOptions = this.options.fields[field];
            let result = false;
            if (this.readOnly) {
                result = true;
            }
            else if (typeof fieldOptions.readOnly === "boolean") {
                result = (_a = fieldOptions.readOnly) !== null && _a !== void 0 ? _a : false;
            }
            else if (typeof fieldOptions.readOnly === "function") {
                result = fieldOptions.readOnly(this);
            }
            return result;
        };
        /**
         * Vrací hodnoty pole
         */
        this.get = (field) => {
            return Object.assign(Object.assign({}, this._fields[field]), { readOnly: this.isFieldReadOnly(field), options: this.options.fields[field] });
        };
        /**
         * Vrací zda je hodnota povinná
         */
        this.isFieldRequired = (field) => {
            const requiredFlag = this.options.fields[field].required;
            if (typeof requiredFlag === "boolean") {
                return requiredFlag;
            }
            if (typeof requiredFlag === "function") {
                return requiredFlag(this);
            }
            return false;
        };
        this.getFieldTitle = (field) => {
            const title = this.options.fields[field].title;
            return typeof title === "function" ? title(this) : title;
        };
        /**
         * Nastaví hodnotu pole
         */
        this.set = (field, value) => {
            const options = this.options.fields[field];
            this._fields[field].value = value;
            this._fields[field].validation = this._validated && options.validate ? options.validate(value, options, this) : "";
            const onChange = this.options.fields[field].onChange;
            if (onChange) {
                onChange(value, this.options.fields[field], this);
            }
            this.handleChangeForm();
        };
        /**
         * Provede validaci formuláře
         */
        this.validate = () => {
            for (let i in this._fields) {
                const options = this.options.fields[i];
                this._fields[i].validation = options.validate ? options.validate(this._fields[i].value, options, this) : "";
            }
            this._validated = true;
            this._subForms.map(i => i.validate());
        };
        /**
         * Provede revalidaci fieldu, pokud již byl field validován
         */
        this.validateField = (field) => {
            const options = this.options.fields[field];
            this._fields[field].validation = options.validate ? options.validate(this._fields[field].value, options, this) : "";
        };
        /**
         * Odstraní provedené validace
         */
        this.clearValidations = () => {
            for (let i in this._fields) {
                this._fields[i].validation = "";
            }
            this._validated = false;
            this._subForms.map(i => i.clearValidations());
        };
        /**
         * Resetuje položky formuláře
         */
        this.clearFields = () => __awaiter(this, void 0, void 0, function* () {
            this.setDefaultFields();
            this._validated = false;
            this._subForms.map(i => i.clearFields());
            this.handleChangeForm();
        });
        this.setDefaultFields();
        if (parent) {
            parent._subForms.push(this);
        }
        mobx_1.makeObservable(this, {
            _fields: mobx_1.observable,
            _validated: mobx_1.observable,
            _readOnly: mobx_1.observable
        });
    }
    /**
     * Formulář je validován. Avšak nemusí obsahovat validní hodnoty!
     */
    get validated() {
        return this._validated && this._subForms.map(i => i.validated).length === this._subForms.length;
    }
    /**
     * Formulář byl validován a obsahuje validní hodnoty.
     */
    get isValid() {
        if (!this.validated) {
            return false;
        }
        for (let i in this._fields) {
            if (this._fields[i].validation !== "") {
                return false;
            }
        }
        return this._subForms.filter(i => i.isValid).length === this._subForms.length;
    }
    /**
     * Vrací položky formuláře
     */
    get fields() {
        const result = {};
        const fields = this._fields;
        for (let p in fields) {
            result[p] = fields[p].value;
        }
        return result;
    }
    /**
     * Nastaví položky formuláře
     */
    set fields(fields) {
        for (let i in this._fields) {
            const field = fields[i];
            this._fields[i].value = field !== null && field !== void 0 ? field : this._fields[i].value;
        }
        this.handleChangeForm();
    }
    set readOnly(readOnly) {
        this._readOnly = readOnly;
        for (let i of this._subForms) {
            i.readOnly = readOnly;
        }
    }
    get readOnly() {
        return this._readOnly;
    }
}
exports.Form = Form;
/**
 * Kolekce formulářů
 */
class FormCollection {
    constructor(options, parentForm) {
        this.options = options;
        this.parentForm = parentForm;
        this.addWithOptions = (options) => {
            const newForm = new Form(options !== null && options !== void 0 ? options : this.options, this.parentForm);
            this.subForms.push(newForm);
            return newForm;
        };
        this.add = () => {
            return this.addWithOptions(this.options);
        };
        this.remove = (form) => {
            this.subForms = this.subForms.filter(i => i !== form);
        };
        this.get = () => {
            return this.subForms;
        };
        this.validate = () => __awaiter(this, void 0, void 0, function* () {
            this.subForms.forEach(i => i.validate());
        });
        this.clearFields = () => {
            this.subForms.forEach(i => i.clearFields());
        };
        this.clearValidations = () => {
            this.subForms.forEach(i => i.clearValidations());
        };
        this.subForms = [];
    }
    get isValid() {
        return this.subForms.length === this.subForms.map(i => i.isValid).length;
    }
    get validated() {
        return this.subForms.length === this.subForms.map(i => i.validated).length;
    }
    set fields(fields) {
        this.subForms = [];
        fields.forEach(i => { this.add().fields = i; });
    }
    set readOnly(readOnly) {
        this.subForms.forEach(i => i.readOnly = readOnly);
    }
}
exports.FormCollection = FormCollection;
