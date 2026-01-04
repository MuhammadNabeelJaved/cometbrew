import { Router } from 'express';
import {
    registerUser, loginUser, getUserProfile, deleteUser, getAllUserProfile,
    updateUserProfile, updateUserPassword, forgotPassword, resetPassword, verifyUserEmail
} from '../controllers/user.controller.js';
import { userAuthenticated, authorizeRoles } from '../middlewares/Auth.js';
import upload from '../middlewares/multer.js';

const router = Router();

router.route('/register').post(upload.single('avatar'), registerUser);
router.route('/verify').post(verifyUserEmail);
router.route('/login').post(loginUser);
router.route('/profile/:id').get(userAuthenticated, getUserProfile);
router.route('/:id').delete(userAuthenticated, deleteUser);
router.route('/').get(userAuthenticated, authorizeRoles('admin'), getAllUserProfile);
router.route('/update/:id').put(userAuthenticated, upload.single('avatar'), updateUserProfile);
router.route('/update-password/:id').put(userAuthenticated, updateUserPassword);
router.route('/forgot-password').post(userAuthenticated, forgotPassword);
router.route('/reset-password/:token').post(userAuthenticated, resetPassword);


export default router;