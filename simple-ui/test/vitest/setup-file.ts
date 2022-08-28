// This file will be run before each test file
import { createPinia, Pinia, setActivePinia } from 'pinia';

setActivePinia(createPinia()) as Pinia;
