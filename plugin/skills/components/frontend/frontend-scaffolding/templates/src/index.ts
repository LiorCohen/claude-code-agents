import './index.css';
import { mount } from './main';

(window as Record<string, unknown>).__webapp_start__ = mount;
