// This file will be run before each test file
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

setActivePinia(createTestingPinia({ stubActions: false }));
