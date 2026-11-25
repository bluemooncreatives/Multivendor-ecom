-- phpMyAdmin SQL Dump
-- version 4.9.7
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Feb 23, 2022 at 12:05 AM
-- Server version: 5.7.37
-- PHP Version: 7.3.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `software_ecommercemvendor22`
--

-- --------------------------------------------------------

--
-- Table structure for table `addons`
--

CREATE TABLE `addons` (
  `id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf32_unicode_ci DEFAULT NULL,
  `unique_identifier` varchar(255) COLLATE utf32_unicode_ci DEFAULT NULL,
  `version` varchar(255) COLLATE utf32_unicode_ci DEFAULT NULL,
  `activated` int(1) NOT NULL DEFAULT '1',
  `image` varchar(1000) COLLATE utf32_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf32 COLLATE=utf32_unicode_ci;

--
-- Dumping data for table `addons`
--

INSERT INTO `addons` (`id`, `name`, `unique_identifier`, `version`, `activated`, `image`, `created_at`, `updated_at`) VALUES
(1, 'affiliate', 'affiliate_system', '1.3', 0, 'affiliate_banner.jpg', '2020-11-17 00:56:18', '2020-11-18 23:42:28'),
(2, 'Offline Payment', 'offline_payment', '1.2 - daviruzsystems.com', 1, 'offline_banner.jpg', '2020-11-17 00:57:48', '2020-11-17 00:57:48'),
(3, 'Point of Sale', 'pos_system', '1.2 - daviruzsystems.com', 0, 'pos_banner.jpg', '2020-11-17 00:58:40', '2020-11-18 23:42:22'),
(4, 'Seller Subscription System', 'seller_subscription', '1.0', 0, 'seller_subscription.jpg', '2020-11-17 00:58:57', '2020-11-18 23:40:33');

-- --------------------------------------------------------

--
-- Table structure for table `addresses`
--

CREATE TABLE `addresses` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `address` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `country` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `city` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `postal_code` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `set_default` int(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `addresses`
--

INSERT INTO `addresses` (`id`, `user_id`, `address`, `country`, `city`, `postal_code`, `phone`, `set_default`, `created_at`, `updated_at`) VALUES
(1, 12, 'B 10 Akshardham Bunglow 2, Government Tube Well Road, Bopal', 'India', 'Ambli , Ahmedabad, Ahmedabad', '380058', '7016311514', 0, '2020-11-12 15:53:51', '2020-11-12 15:53:51'),
(2, 14, 'bhuj', 'India', 'bhuj', 'bhuj', '7016210179', 0, '2020-11-16 16:17:19', '2020-11-16 16:17:19'),
(3, 34, '266 Old Umednagar, Bhuj Kachchh, 37001', 'India', 'Bhuj', '370001', '+917016210179', 0, '2020-11-27 15:20:02', '2020-11-27 15:20:02'),
(4, 52, 'Vinayak, gerwali Vandi,', 'India', 'Bhuj', '370001', '9426815370', 0, '2020-12-31 12:32:40', '2020-12-31 12:32:40');

-- --------------------------------------------------------

--
-- Table structure for table `affiliate_configs`
--

CREATE TABLE `affiliate_configs` (
  `id` int(11) NOT NULL,
  `type` varchar(1000) COLLATE utf32_unicode_ci DEFAULT NULL,
  `value` text COLLATE utf32_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf32 COLLATE=utf32_unicode_ci;

--
-- Dumping data for table `affiliate_configs`
--

INSERT INTO `affiliate_configs` (`id`, `type`, `value`, `created_at`, `updated_at`) VALUES
(1, 'verification_form', '[{\"type\":\"text\",\"label\":\"Your name\"},{\"type\":\"text\",\"label\":\"Email\"},{\"type\":\"text\",\"label\":\"Full Address\"},{\"type\":\"text\",\"label\":\"Phone Number\"},{\"type\":\"text\",\"label\":\"How will you affiliate?\"}]', '2020-03-09 09:56:21', '2020-03-09 04:30:59');

-- --------------------------------------------------------

--
-- Table structure for table `affiliate_options`
--

CREATE TABLE `affiliate_options` (
  `id` int(11) NOT NULL,
  `type` varchar(255) COLLATE utf32_unicode_ci DEFAULT NULL,
  `details` longtext COLLATE utf32_unicode_ci,
  `percentage` double NOT NULL DEFAULT '0',
  `status` int(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf32 COLLATE=utf32_unicode_ci;

--
-- Dumping data for table `affiliate_options`
--

INSERT INTO `affiliate_options` (`id`, `type`, `details`, `percentage`, `status`, `created_at`, `updated_at`) VALUES
(2, 'user_registration_first_purchase', '[]', 20, 1, '2020-03-03 05:08:37', '2020-11-17 10:08:01'),
(3, 'product_sharing', '{\"commission\":\"1\",\"commission_type\":\"amount\"}', 20, 0, '2020-03-08 01:55:03', '2020-11-17 10:07:58'),
(4, 'category_wise_affiliate', NULL, 0, 0, '2020-03-08 01:55:03', '2020-03-10 02:12:32');

-- --------------------------------------------------------

--
-- Table structure for table `affiliate_payments`
--

CREATE TABLE `affiliate_payments` (
  `id` int(11) NOT NULL,
  `affiliate_user_id` int(11) NOT NULL,
  `amount` double(8,2) NOT NULL,
  `payment_method` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `payment_details` longtext COLLATE utf8_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `affiliate_payments`
--

INSERT INTO `affiliate_payments` (`id`, `affiliate_user_id`, `amount`, `payment_method`, `payment_details`, `created_at`, `updated_at`) VALUES
(2, 1, 20.00, 'Paypal', NULL, '2020-03-10 02:04:30', '2020-03-10 02:04:30');

-- --------------------------------------------------------

--
-- Table structure for table `affiliate_users`
--

CREATE TABLE `affiliate_users` (
  `id` int(11) NOT NULL,
  `paypal_email` varchar(255) COLLATE utf32_unicode_ci DEFAULT NULL,
  `bank_information` text COLLATE utf32_unicode_ci,
  `user_id` int(11) NOT NULL,
  `informations` text COLLATE utf32_unicode_ci,
  `balance` double(10,2) NOT NULL DEFAULT '0.00',
  `status` int(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf32 COLLATE=utf32_unicode_ci;

--
-- Dumping data for table `affiliate_users`
--

INSERT INTO `affiliate_users` (`id`, `paypal_email`, `bank_information`, `user_id`, `informations`, `balance`, `status`, `created_at`, `updated_at`) VALUES
(1, 'demo@gmail.com', '123456', 8, '[{\"type\":\"text\",\"label\":\"Your name\",\"value\":\"Nostrum dicta sint l\"},{\"type\":\"text\",\"label\":\"Email\",\"value\":\"Aut perferendis null\"},{\"type\":\"text\",\"label\":\"Full Address\",\"value\":\"Voluptatem Sit dolo\"},{\"type\":\"text\",\"label\":\"Phone Number\",\"value\":\"Ut ad beatae occaeca\"},{\"type\":\"text\",\"label\":\"How will you affiliate?\",\"value\":\"Porro sint soluta u\"}]', 30.00, 1, '2020-03-09 05:35:07', '2020-03-10 02:04:30');

-- --------------------------------------------------------

--
-- Table structure for table `affiliate_withdraw_requests`
--

CREATE TABLE `affiliate_withdraw_requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` double(10,2) NOT NULL,
  `status` int(1) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `app_settings`
--

CREATE TABLE `app_settings` (
  `id` int(11) UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `logo` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `currency_id` int(11) DEFAULT NULL,
  `currency_format` char(10) COLLATE utf8_unicode_ci DEFAULT NULL,
  `facebook` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `twitter` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `instagram` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `youtube` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `google_plus` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `app_settings`
--

INSERT INTO `app_settings` (`id`, `name`, `logo`, `currency_id`, `currency_format`, `facebook`, `twitter`, `instagram`, `youtube`, `google_plus`, `created_at`, `updated_at`) VALUES
(1, 'Active eCommerce', 'uploads/logo/matggar.png', 1, 'symbol', 'https://facebook.com', 'https://twitter.com', 'https://instagram.com', 'https://youtube.com', 'https://google.com', '2019-08-04 16:39:15', '2019-08-04 16:39:18');

-- --------------------------------------------------------

--
-- Table structure for table `attributes`
--

CREATE TABLE `attributes` (
  `id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf32_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf32 COLLATE=utf32_unicode_ci;

--
-- Dumping data for table `attributes`
--

INSERT INTO `attributes` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'Size', '2020-02-24 05:55:07', '2020-02-24 05:55:07'),
(2, 'Fabric', '2020-02-24 05:55:13', '2020-02-24 05:55:13'),
(3, 'Color', '2020-11-27 17:49:53', '2020-11-27 17:49:53');

-- --------------------------------------------------------

--
-- Table structure for table `banners`
--

CREATE TABLE `banners` (
  `id` int(11) NOT NULL,
  `photo` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `url` varchar(1000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `position` int(11) NOT NULL DEFAULT '1',
  `published` int(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `banners`
--

INSERT INTO `banners` (`id`, `photo`, `url`, `position`, `published`, `created_at`, `updated_at`) VALUES
(4, 'uploads/banners/B1Sy4G2KehBTRFWcWpexjcdxavsRZHG7TXY0vpwo.png', 'https://ecommercemultivendor.softwarestore.biz/', 1, 1, '2019-03-12 05:58:23', '2020-11-19 22:45:37'),
(5, 'uploads/banners/jcAhZp49MU1fLQQAcs179dskoANdVocXUAjqajEd.png', 'https://ecommercemultivendor.softwarestore.biz/', 1, 1, '2019-03-12 05:58:41', '2020-11-19 22:45:48'),
(6, 'uploads/banners/mSsxKu8y9n9VQLhLoxBmJllCQfZasjJVz9Rtqvvu.png', 'https://ecommercemultivendor.softwarestore.biz/', 2, 1, '2019-03-12 05:58:52', '2020-11-19 22:46:33'),
(7, 'uploads/banners/4VyEFfqv5PW3aNf1WRXkwQlrjqI2X73AqjAYLT34.png', 'https://ecommercemultivendor.softwarestore.biz/', 2, 1, '2019-05-26 05:16:38', '2020-11-19 22:46:45'),
(8, 'uploads/banners/banner.jpg', 'https://ecommercemultivendor.softwarestore.biz/', 2, 0, '2019-06-11 05:00:06', '2020-11-19 21:50:24'),
(9, 'uploads/banners/ndPuWIFp0nVDtthmgIwb9eM9LwQtKYuQAvSQKLR4.png', 'https://ecommercemultivendor.softwarestore.biz/', 1, 1, '2019-06-11 05:00:15', '2020-11-19 22:46:00'),
(10, 'uploads/banners/HPXQ49aDpwiObOkrieuJDA3sZEYLoXPiaRl4wBZ5.png', 'https://ecommercemultivendor.softwarestore.biz/', 1, 1, '2019-06-11 05:00:24', '2020-11-19 22:46:12');

-- --------------------------------------------------------

--
-- Table structure for table `brands`
--

CREATE TABLE `brands` (
  `id` int(11) NOT NULL,
  `name` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `logo` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `top` int(1) NOT NULL DEFAULT '0',
  `slug` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `meta_title` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `meta_description` text COLLATE utf8_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `brands`
--

INSERT INTO `brands` (`id`, `name`, `logo`, `top`, `slug`, `meta_title`, `meta_description`, `created_at`, `updated_at`) VALUES
(2, 'Aardra Fashion', 'uploads/brands/eNjzwtiK1MdgteHPIP7BBEq2Yni7wv5XdAvIQG4Q.png', 1, 'aardra-fashion-kurti', 'aardra-fashion', 'Kurtis by Aardra Fashion', '2019-03-12 06:06:13', '2020-11-24 14:39:01'),
(3, 'US Polo', 'uploads/brands/VB2qPddwkfV0sT6Vnkqr4kfLYDbCvcVONu1RP5Yi.jpeg', 0, 'US-Polo-tJha4', 'US Polo', 'T-shirt, Shirts, Jeans, Hoodies and Mens Wear', '2020-11-21 16:18:40', '2020-11-21 16:18:40'),
(4, 'Talent', NULL, 0, 'Talent-xzZJX', 'Talent', 'Women\'s\r\nEthnic Wear\r\nTop\r\nKurti', '2020-11-23 15:14:43', '2020-11-23 15:14:43'),
(5, 'Haseena', NULL, 0, 'Haseena-S0aok', 'Haseena', 'Women\'s\r\nRayon Print Handwork\r\nEthnic Wear\r\nTop\r\nKurti', '2020-11-23 15:15:44', '2020-11-23 15:15:44'),
(6, 'Sony', NULL, 0, 'Sony-x6xAk', 'Sony', 'Women\'s\r\nLilen Handwork\r\nEthnic Wear\r\nTop\r\nKurti', '2020-11-23 15:16:32', '2020-11-23 15:16:32'),
(7, 'Zalak - 2', NULL, 0, 'Zalak---2-torQL', 'Zalak - 2', 'Women\'s\r\nPant Set\r\nRayon Slub Handwork\r\nEthnic Wear\r\nTop\r\nKurti', '2020-11-23 15:17:07', '2020-11-23 15:18:17'),
(8, 'Zara', 'uploads/brands/aEMcgvMpl949LHL2GKxoSU7ea9VdxF5axsKbSD5o.jpeg', 0, 'Zara-1jhqh', 'Zara', 'Jeans\r\nDenim', '2020-11-24 15:05:48', '2020-11-24 15:05:48'),
(9, 'Parx', 'uploads/brands/nDGYe7r3hkrZ36qlTG6xLwP2Eg3d7MTSX0tPPHIl.jpeg', 0, 'Parx-Rsqxd', 'Parx', 'Jeans\r\nDenim', '2020-11-24 15:06:27', '2020-11-24 15:06:27'),
(10, 'Buffalo', 'uploads/brands/BAUwVvPxI9jPZK5ggZAoshs42jtGpf3Fz29JSJLk.jpeg', 0, 'Buffalo-4vT1l', 'Buffalo', 'Denim\r\nJeans', '2020-11-24 15:06:51', '2020-11-24 15:06:51'),
(11, 'Pepe Jeans', 'uploads/brands/yBUHMNcZdQl1bS0eDrQJ9y6Mia5lvbRUJaGEMIeq.jpeg', 0, 'Pepe-Jeans-Rsm0S', 'Pepe Jeans', 'Denim\r\nJeans', '2020-11-24 15:07:25', '2020-11-24 15:07:25'),
(12, 'Levis', 'uploads/brands/uQLFiNsjBKN2KVUUVRaOngz2jndPjQaqZrHuCJJY.jpeg', 0, 'Levis-oWlHb', 'Levis', 'Jeans\r\nDenim', '2020-11-24 15:07:58', '2020-11-24 15:07:58'),
(13, 'Park Avenue', 'uploads/brands/0LYQINk3iKmR2nfDL8oUy9ZaWztM3FIDlS5fCu7h.jpeg', 0, 'Park-Avenue-MX35X', 'Park Avenue', 'Denim\r\nJeans', '2020-11-24 15:08:37', '2020-11-24 15:08:37'),
(14, 'Spykar', 'uploads/brands/19fRy6x4n9XcvGdjJzmQ6BNFmRNyhWuhiHbbdJRN.jpeg', 0, 'Spykar-IaVuo', 'Spykar', 'Denim\r\nJeans', '2020-11-24 15:09:05', '2020-11-24 15:11:32'),
(15, 'Jack&Jones', 'uploads/brands/H7ejuIIeYougw1OlNmkZklkPf1BMWpKnmk4AmMo4.jpeg', 0, 'JackJones-4gA73', 'Jack&Jones', NULL, '2020-12-09 15:47:18', '2020-12-09 15:47:18');

-- --------------------------------------------------------

--
-- Table structure for table `business_settings`
--

CREATE TABLE `business_settings` (
  `id` int(11) NOT NULL,
  `type` varchar(30) COLLATE utf8_unicode_ci NOT NULL,
  `value` longtext COLLATE utf8_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `business_settings`
--

INSERT INTO `business_settings` (`id`, `type`, `value`, `created_at`, `updated_at`) VALUES
(1, 'home_default_currency', '28', '2018-10-16 01:35:52', '2020-11-07 17:43:53'),
(2, 'system_default_currency', '28', '2018-10-16 01:36:58', '2020-11-07 17:43:53'),
(3, 'currency_format', '1', '2018-10-17 03:01:59', '2018-10-17 03:01:59'),
(4, 'symbol_format', '1', '2018-10-17 03:01:59', '2019-01-20 02:10:55'),
(5, 'no_of_decimals', '3', '2018-10-17 03:01:59', '2020-03-04 00:57:16'),
(6, 'product_activation', '1', '2018-10-28 01:38:37', '2019-02-04 01:11:41'),
(7, 'vendor_system_activation', '1', '2018-10-28 07:44:16', '2019-02-04 01:11:38'),
(8, 'show_vendors', '1', '2018-10-28 07:44:47', '2019-02-04 01:11:13'),
(9, 'paypal_payment', '0', '2018-10-28 07:45:16', '2019-01-31 05:09:10'),
(10, 'stripe_payment', '0', '2018-10-28 07:45:47', '2018-11-14 01:51:51'),
(11, 'cash_payment', '1', '2018-10-28 07:46:05', '2019-01-24 03:40:18'),
(12, 'payumoney_payment', '0', '2018-10-28 07:46:27', '2019-03-05 05:41:36'),
(13, 'best_selling', '1', '2018-12-24 08:13:44', '2019-02-14 05:29:13'),
(14, 'paypal_sandbox', '0', '2019-01-16 12:44:18', '2019-01-16 12:44:18'),
(15, 'sslcommerz_sandbox', '1', '2019-01-16 12:44:18', '2019-03-14 00:07:26'),
(16, 'sslcommerz_payment', '0', '2019-01-24 09:39:07', '2019-01-29 06:13:46'),
(17, 'vendor_commission', '20', '2019-01-31 06:18:04', '2019-04-13 06:49:26'),
(18, 'verification_form', '[{\"type\":\"text\",\"label\":\"Your name\"},{\"type\":\"text\",\"label\":\"Shop name\"},{\"type\":\"text\",\"label\":\"Email\"},{\"type\":\"text\",\"label\":\"PAN Card \\/ Store Visiting Card\\/ Municipal Certificate\\/\"},{\"type\":\"text\",\"label\":\"Full Address\"},{\"type\":\"text\",\"label\":\"Phone Number\"},{\"type\":\"file\",\"label\":\"PAN CARD \\/ Store Visiting Card\\/ Municipal Certificate\"}]', '2019-02-03 11:36:58', '2020-11-24 14:59:37'),
(19, 'google_analytics', '1', '2019-02-06 12:22:35', '2020-11-11 20:34:17'),
(20, 'facebook_login', '1', '2019-02-07 12:51:59', '2020-11-11 21:18:33'),
(21, 'google_login', '1', '2019-02-07 12:52:10', '2020-11-11 21:18:35'),
(22, 'twitter_login', '0', '2019-02-07 12:52:20', '2019-02-08 02:32:56'),
(23, 'payumoney_payment', '1', '2019-03-05 11:38:17', '2019-03-05 11:38:17'),
(24, 'payumoney_sandbox', '1', '2019-03-05 11:38:17', '2019-03-05 05:39:18'),
(36, 'facebook_chat', '1', '2019-04-15 11:45:04', '2020-11-11 20:38:49'),
(37, 'email_verification', '1', '2019-04-30 07:30:07', '2020-11-11 21:18:52'),
(38, 'wallet_system', '0', '2019-05-19 08:05:44', '2019-05-19 02:11:57'),
(39, 'coupon_system', '1', '2019-06-11 09:46:18', '2020-11-11 21:46:16'),
(40, 'current_version', '3.5', '2019-06-11 09:46:18', '2019-06-11 09:46:18'),
(41, 'instamojo_payment', '0', '2019-07-06 09:58:03', '2019-07-06 09:58:03'),
(42, 'instamojo_sandbox', '1', '2019-07-06 09:58:43', '2019-07-06 09:58:43'),
(43, 'razorpay', '0', '2019-07-06 09:58:43', '2019-07-06 09:58:43'),
(44, 'paystack', '0', '2019-07-21 13:00:38', '2019-07-21 13:00:38'),
(45, 'pickup_point', '0', '2019-10-17 11:50:39', '2019-10-17 11:50:39'),
(46, 'maintenance_mode', '0', '2019-10-17 11:51:04', '2020-11-11 21:47:01'),
(47, 'voguepay', '0', '2019-10-17 11:51:24', '2019-10-17 11:51:24'),
(48, 'voguepay_sandbox', '0', '2019-10-17 11:51:38', '2019-10-17 11:51:38'),
(50, 'category_wise_commission', '0', '2020-01-21 07:22:47', '2020-01-21 07:22:47'),
(51, 'conversation_system', '1', '2020-01-21 07:23:21', '2020-01-21 07:23:21'),
(52, 'guest_checkout_active', '1', '2020-01-22 07:36:38', '2020-01-22 07:36:38'),
(53, 'facebook_pixel', '1', '2020-01-22 11:43:58', '2020-11-11 20:41:46'),
(55, 'classified_product', '0', '2020-05-13 13:01:05', '2020-11-11 21:46:09'),
(56, 'pos_activation_for_seller', '1', '2020-06-11 09:45:02', '2020-06-11 09:45:02'),
(57, 'shipping_type', 'product_wise_shipping', '2020-07-01 13:49:56', '2020-07-01 13:49:56'),
(58, 'flat_rate_shipping_cost', '0', '2020-07-01 13:49:56', '2020-07-01 13:49:56'),
(59, 'shipping_cost_admin', '0', '2020-07-01 13:49:56', '2020-07-01 13:49:56'),
(60, 'payhere_sandbox', '0', '2020-07-30 18:23:53', '2020-07-30 18:23:53'),
(61, 'payhere', '0', '2020-07-30 18:23:53', '2020-07-30 18:23:53'),
(62, 'google_recaptcha', '0', '2020-08-17 07:13:37', '2020-08-17 07:13:37'),
(63, 'ngenius', '0', '2020-09-22 10:58:21', '2020-09-22 10:58:21');

-- --------------------------------------------------------

--
-- Table structure for table `carts`
--

CREATE TABLE `carts` (
  `id` int(11) UNSIGNED NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `variation` text COLLATE utf8_unicode_ci,
  `price` double(8,2) DEFAULT NULL,
  `tax` double(8,2) DEFAULT NULL,
  `shipping_cost` double(8,2) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `carts`
--

INSERT INTO `carts` (`id`, `user_id`, `product_id`, `variation`, `price`, `tax`, `shipping_cost`, `quantity`, `created_at`, `updated_at`) VALUES
(4, 18, 2, NULL, 95.00, 0.00, 0.00, 1, '2020-11-21 16:25:37', '2020-11-21 16:26:19'),
(5, 13, 13, 'DarkGray-34', 1499.00, 0.00, 0.00, 1, '2020-11-21 18:48:50', '2020-11-22 14:01:23'),
(8, 13, 16, 'DarkRed-M', 835.00, 0.00, 0.00, 1, '2020-11-23 15:43:34', '2020-11-23 15:43:34'),
(9, 41, 17, 'DarkGray-M', 1200.00, 0.00, 0.00, 1, '2020-11-28 21:38:20', '2020-11-28 21:38:20'),
(10, 41, 45, 'S-Rayon', 1099.00, 0.00, 0.00, 1, '2020-11-28 21:39:52', '2020-11-28 21:39:52'),
(11, 41, 45, 'M-Rayon', 1099.00, 0.00, 0.00, 2, '2020-11-28 21:39:55', '2021-01-23 14:48:59'),
(12, 41, 13, 'DarkBlue-38', 1499.00, 0.00, 0.00, 1, '2020-11-28 21:40:55', '2021-01-23 14:50:23'),
(13, 12, 12, 'M', 1260.00, 0.00, 0.00, 1, '2020-11-29 10:02:14', '2020-11-29 10:02:14'),
(14, 42, 45, 'XXL-Rayon', 1099.00, 0.00, 0.00, 2, '2020-11-29 11:55:39', '2020-11-29 11:55:47'),
(15, 42, 16, 'Gray-XXL', 835.00, 0.00, 0.00, 1, '2020-11-29 12:06:35', '2020-11-29 12:06:35'),
(16, 42, 16, 'DarkRed-L', 835.00, 0.00, 0.00, 1, '2020-11-29 12:06:40', '2020-11-29 12:06:40'),
(18, 12, 46, '44-Rayon', 899.00, 0.00, 0.00, 1, '2020-11-29 13:27:46', '2020-11-29 13:27:46'),
(19, 12, 43, '42', 1099.00, 0.00, 0.00, 1, '2020-11-29 13:48:47', '2020-11-29 13:48:47'),
(21, 44, 14, NULL, 350.00, 0.00, 0.00, 2, '2020-11-29 14:14:25', '2020-11-29 14:15:06'),
(23, 43, 58, NULL, 600.00, 0.00, 0.00, 1, '2020-11-30 17:52:49', '2020-12-10 23:51:06'),
(25, 12, 119, 'GreenYellow-38-Rayon', 899.00, 0.00, 0.00, 1, '2020-12-27 22:46:34', '2020-12-27 22:46:34'),
(26, 41, 157, 'XL', 1200.00, 0.00, 0.00, 1, '2021-01-23 14:48:43', '2021-01-23 14:48:51'),
(27, 41, 161, 'Blue-42', 1000.00, 0.00, 0.00, 1, '2021-01-23 14:50:19', '2021-01-23 14:50:19'),
(28, 41, 87, NULL, 640.00, 0.00, 0.00, 2, '2021-01-23 14:51:05', '2021-01-23 14:52:07'),
(29, 41, 142, NULL, 390.00, 0.00, 0.00, 1, '2021-01-23 14:51:25', '2021-01-23 14:52:03'),
(30, 41, 46, '44', 899.00, 0.00, 0.00, 1, '2021-01-23 14:51:42', '2021-01-23 14:51:42');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `commision_rate` double(8,2) NOT NULL DEFAULT '0.00',
  `banner` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `icon` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `featured` int(1) NOT NULL DEFAULT '0',
  `top` int(1) NOT NULL DEFAULT '0',
  `digital` int(1) NOT NULL DEFAULT '0',
  `slug` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `meta_title` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `meta_description` text COLLATE utf8_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `commision_rate`, `banner`, `icon`, `featured`, `top`, `digital`, `slug`, `meta_title`, `meta_description`, `created_at`, `updated_at`) VALUES
(1, 'Women\'s Fashion', 0.00, 'uploads/categories/banner/KMGJcwSSTApCZTQLAugOiZAqgSy7yNN9Zd6P3Jh9.png', 'uploads/categories/icon/KjJP9wuEZNL184XVUk3S7EiZ8NnBN99kiU4wdvp3.png', 1, 1, 0, 'women-fashion', 'women-fashion', 'Women\'s Fashion', '2020-11-11 17:34:21', '2020-11-11 23:04:21'),
(2, 'Men\'s Fashion', 0.00, 'uploads/categories/banner/EQQaYvBpsSIHJ3qeOlH3Y4MeSySP2gvS0FYQwinZ.png', 'uploads/categories/icon/h9XhWwI401u6sRoLITEk9SUMRAlWN8moGrpPfS6I.png', 1, 0, 0, 'men-fashion', 'men-fashion', 'Men\'s Fashion', '2020-11-11 17:34:46', '2020-11-11 23:04:46'),
(3, 'Home And Kitchen', 0.00, 'uploads/categories/banner/A2reyaxxrlumdbt7hg4Y0rhxaMgoHq2hY6VmNlI8.png', 'uploads/categories/icon/rKAPw5rNlS84JtD9ZQqn366jwE11qyJqbzAe5yaA.png', 1, 1, 0, 'home-kitchen', 'home-kitchen', 'Home Decoration, Kitchen Items', '2020-11-11 17:35:04', '2020-11-11 23:05:04'),
(4, 'Kid\'s Fashion & Toys', 0.00, 'uploads/categories/banner/rm7Apca5PZrSwVJjRkSfeWnhZwkzNHuFDvNX6gH0.png', 'uploads/categories/icon/IY3vkYTrClFRA7kwQR3vVR7lHaS7jMEvwZpmEbpc.svg', 1, 1, 0, 'Kids-Fashion--Toys-r3qOi', 'kids-fashion-n-toys', 'Kids, Fashion, Accessories, Toys etc.', '2020-11-19 17:09:21', '2020-11-19 22:39:21'),
(5, 'Sports And Fitness', 0.00, 'uploads/categories/banner/9clHADh7z5f1D14L7669UpnocFezyesAZE4aOXDL.png', 'uploads/categories/icon/zNj500K2IzUgfZo2Q9jODvwuhVAIEr8O0S9VGLLq.svg', 1, 1, 0, 'Sports-And-Fitness-JzBK3', 'sports-and-fitness', 'All accessories, gears, equipment, clothes related to sports and fitness', '2020-11-22 08:28:50', '2020-11-22 13:58:50');

-- --------------------------------------------------------

--
-- Table structure for table `colors`
--

CREATE TABLE `colors` (
  `id` int(11) NOT NULL,
  `name` varchar(30) COLLATE utf8_unicode_ci DEFAULT NULL,
  `code` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `colors`
--

INSERT INTO `colors` (`id`, `name`, `code`, `created_at`, `updated_at`) VALUES
(1, 'IndianRed', '#CD5C5C', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(2, 'LightCoral', '#F08080', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(3, 'Salmon', '#FA8072', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(4, 'DarkSalmon', '#E9967A', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(5, 'LightSalmon', '#FFA07A', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(6, 'Crimson', '#DC143C', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(7, 'Red', '#FF0000', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(8, 'FireBrick', '#B22222', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(9, 'DarkRed', '#8B0000', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(10, 'Pink', '#FFC0CB', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(11, 'LightPink', '#FFB6C1', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(12, 'HotPink', '#FF69B4', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(13, 'DeepPink', '#FF1493', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(14, 'MediumVioletRed', '#C71585', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(15, 'PaleVioletRed', '#DB7093', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(16, 'LightSalmon', '#FFA07A', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(17, 'Coral', '#FF7F50', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(18, 'Tomato', '#FF6347', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(19, 'OrangeRed', '#FF4500', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(20, 'DarkOrange', '#FF8C00', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(21, 'Orange', '#FFA500', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(22, 'Gold', '#FFD700', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(23, 'Yellow', '#FFFF00', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(24, 'LightYellow', '#FFFFE0', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(25, 'LemonChiffon', '#FFFACD', '2018-11-05 02:12:26', '2018-11-05 02:12:26'),
(26, 'LightGoldenrodYellow', '#FAFAD2', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(27, 'PapayaWhip', '#FFEFD5', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(28, 'Moccasin', '#FFE4B5', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(29, 'PeachPuff', '#FFDAB9', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(30, 'PaleGoldenrod', '#EEE8AA', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(31, 'Khaki', '#F0E68C', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(32, 'DarkKhaki', '#BDB76B', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(33, 'Lavender', '#E6E6FA', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(34, 'Thistle', '#D8BFD8', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(35, 'Plum', '#DDA0DD', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(36, 'Violet', '#EE82EE', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(37, 'Orchid', '#DA70D6', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(38, 'Fuchsia', '#FF00FF', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(39, 'Magenta', '#FF00FF', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(40, 'MediumOrchid', '#BA55D3', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(41, 'MediumPurple', '#9370DB', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(42, 'Amethyst', '#9966CC', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(43, 'BlueViolet', '#8A2BE2', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(44, 'DarkViolet', '#9400D3', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(45, 'DarkOrchid', '#9932CC', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(46, 'DarkMagenta', '#8B008B', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(47, 'Purple', '#800080', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(48, 'Indigo', '#4B0082', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(49, 'SlateBlue', '#6A5ACD', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(50, 'DarkSlateBlue', '#483D8B', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(51, 'MediumSlateBlue', '#7B68EE', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(52, 'GreenYellow', '#ADFF2F', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(53, 'Chartreuse', '#7FFF00', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(54, 'LawnGreen', '#7CFC00', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(55, 'Lime', '#00FF00', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(56, 'LimeGreen', '#32CD32', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(57, 'PaleGreen', '#98FB98', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(58, 'LightGreen', '#90EE90', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(59, 'MediumSpringGreen', '#00FA9A', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(60, 'SpringGreen', '#00FF7F', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(61, 'MediumSeaGreen', '#3CB371', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(62, 'SeaGreen', '#2E8B57', '2018-11-05 02:12:27', '2018-11-05 02:12:27'),
(63, 'ForestGreen', '#228B22', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(64, 'Green', '#008000', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(65, 'DarkGreen', '#006400', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(66, 'YellowGreen', '#9ACD32', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(67, 'OliveDrab', '#6B8E23', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(68, 'Olive', '#808000', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(69, 'DarkOliveGreen', '#556B2F', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(70, 'MediumAquamarine', '#66CDAA', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(71, 'DarkSeaGreen', '#8FBC8F', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(72, 'LightSeaGreen', '#20B2AA', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(73, 'DarkCyan', '#008B8B', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(74, 'Teal', '#008080', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(75, 'Aqua', '#00FFFF', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(76, 'Cyan', '#00FFFF', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(77, 'LightCyan', '#E0FFFF', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(78, 'PaleTurquoise', '#AFEEEE', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(79, 'Aquamarine', '#7FFFD4', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(80, 'Turquoise', '#40E0D0', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(81, 'MediumTurquoise', '#48D1CC', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(82, 'DarkTurquoise', '#00CED1', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(83, 'CadetBlue', '#5F9EA0', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(84, 'SteelBlue', '#4682B4', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(85, 'LightSteelBlue', '#B0C4DE', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(86, 'PowderBlue', '#B0E0E6', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(87, 'LightBlue', '#ADD8E6', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(88, 'SkyBlue', '#87CEEB', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(89, 'LightSkyBlue', '#87CEFA', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(90, 'DeepSkyBlue', '#00BFFF', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(91, 'DodgerBlue', '#1E90FF', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(92, 'CornflowerBlue', '#6495ED', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(93, 'MediumSlateBlue', '#7B68EE', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(94, 'RoyalBlue', '#4169E1', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(95, 'Blue', '#0000FF', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(96, 'MediumBlue', '#0000CD', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(97, 'DarkBlue', '#00008B', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(98, 'Navy', '#000080', '2018-11-05 02:12:28', '2018-11-05 02:12:28'),
(99, 'MidnightBlue', '#191970', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(100, 'Cornsilk', '#FFF8DC', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(101, 'BlanchedAlmond', '#FFEBCD', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(102, 'Bisque', '#FFE4C4', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(103, 'NavajoWhite', '#FFDEAD', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(104, 'Wheat', '#F5DEB3', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(105, 'BurlyWood', '#DEB887', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(106, 'Tan', '#D2B48C', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(107, 'RosyBrown', '#BC8F8F', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(108, 'SandyBrown', '#F4A460', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(109, 'Goldenrod', '#DAA520', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(110, 'DarkGoldenrod', '#B8860B', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(111, 'Peru', '#CD853F', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(112, 'Chocolate', '#D2691E', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(113, 'SaddleBrown', '#8B4513', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(114, 'Sienna', '#A0522D', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(115, 'Brown', '#A52A2A', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(116, 'Maroon', '#800000', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(117, 'White', '#FFFFFF', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(118, 'Snow', '#FFFAFA', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(119, 'Honeydew', '#F0FFF0', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(120, 'MintCream', '#F5FFFA', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(121, 'Azure', '#F0FFFF', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(122, 'AliceBlue', '#F0F8FF', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(123, 'GhostWhite', '#F8F8FF', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(124, 'WhiteSmoke', '#F5F5F5', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(125, 'Seashell', '#FFF5EE', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(126, 'Beige', '#F5F5DC', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(127, 'OldLace', '#FDF5E6', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(128, 'FloralWhite', '#FFFAF0', '2018-11-05 02:12:29', '2018-11-05 02:12:29'),
(129, 'Ivory', '#FFFFF0', '2018-11-05 02:12:30', '2018-11-05 02:12:30'),
(130, 'AntiqueWhite', '#FAEBD7', '2018-11-05 02:12:30', '2018-11-05 02:12:30'),
(131, 'Linen', '#FAF0E6', '2018-11-05 02:12:30', '2018-11-05 02:12:30'),
(132, 'LavenderBlush', '#FFF0F5', '2018-11-05 02:12:30', '2018-11-05 02:12:30'),
(133, 'MistyRose', '#FFE4E1', '2018-11-05 02:12:30', '2018-11-05 02:12:30'),
(134, 'Gainsboro', '#DCDCDC', '2018-11-05 02:12:30', '2018-11-05 02:12:30'),
(135, 'LightGrey', '#D3D3D3', '2018-11-05 02:12:30', '2018-11-05 02:12:30'),
(136, 'Silver', '#C0C0C0', '2018-11-05 02:12:30', '2018-11-05 02:12:30'),
(137, 'DarkGray', '#A9A9A9', '2018-11-05 02:12:30', '2018-11-05 02:12:30'),
(138, 'Gray', '#808080', '2018-11-05 02:12:30', '2018-11-05 02:12:30'),
(139, 'DimGray', '#696969', '2018-11-05 02:12:30', '2018-11-05 02:12:30'),
(140, 'LightSlateGray', '#778899', '2018-11-05 02:12:30', '2018-11-05 02:12:30'),
(141, 'SlateGray', '#708090', '2018-11-05 02:12:30', '2018-11-05 02:12:30'),
(142, 'DarkSlateGray', '#2F4F4F', '2018-11-05 02:12:30', '2018-11-05 02:12:30'),
(143, 'Black', '#000000', '2018-11-05 02:12:30', '2018-11-05 02:12:30');

-- --------------------------------------------------------

--
-- Table structure for table `conversations`
--

CREATE TABLE `conversations` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `title` varchar(1000) COLLATE utf32_unicode_ci DEFAULT NULL,
  `sender_viewed` int(1) NOT NULL DEFAULT '1',
  `receiver_viewed` int(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf32 COLLATE=utf32_unicode_ci;

--
-- Dumping data for table `conversations`
--

INSERT INTO `conversations` (`id`, `sender_id`, `receiver_id`, `title`, `sender_viewed`, `receiver_viewed`, `created_at`, `updated_at`) VALUES
(1, 12, 9, 'Winter wear', 1, 1, '2020-11-12 16:04:49', '2020-11-12 16:07:35'),
(2, 47, 35, 'Alloy Women\'s Earrings', 1, 1, '2020-11-29 23:00:09', '2020-11-29 23:01:02');

-- --------------------------------------------------------

--
-- Table structure for table `countries`
--

CREATE TABLE `countries` (
  `id` int(11) NOT NULL,
  `code` varchar(2) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `name` varchar(100) COLLATE utf8_unicode_ci NOT NULL DEFAULT '',
  `status` int(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `countries`
--

INSERT INTO `countries` (`id`, `code`, `name`, `status`, `created_at`, `updated_at`) VALUES
(1, 'AF', 'Afghanistan', 1, NULL, NULL),
(2, 'AL', 'Albania', 1, NULL, NULL),
(3, 'DZ', 'Algeria', 1, NULL, NULL),
(4, 'DS', 'American Samoa', 1, NULL, NULL),
(5, 'AD', 'Andorra', 1, NULL, NULL),
(6, 'AO', 'Angola', 1, NULL, NULL),
(7, 'AI', 'Anguilla', 1, NULL, NULL),
(8, 'AQ', 'Antarctica', 1, NULL, NULL),
(9, 'AG', 'Antigua and Barbuda', 1, NULL, NULL),
(10, 'AR', 'Argentina', 1, NULL, NULL),
(11, 'AM', 'Armenia', 1, NULL, NULL),
(12, 'AW', 'Aruba', 1, NULL, NULL),
(13, 'AU', 'Australia', 1, NULL, NULL),
(14, 'AT', 'Austria', 1, NULL, NULL),
(15, 'AZ', 'Azerbaijan', 1, NULL, NULL),
(16, 'BS', 'Bahamas', 1, NULL, NULL),
(17, 'BH', 'Bahrain', 1, NULL, NULL),
(18, 'BD', 'Bangladesh', 1, NULL, NULL),
(19, 'BB', 'Barbados', 1, NULL, NULL),
(20, 'BY', 'Belarus', 1, NULL, NULL),
(21, 'BE', 'Belgium', 1, NULL, NULL),
(22, 'BZ', 'Belize', 1, NULL, NULL),
(23, 'BJ', 'Benin', 1, NULL, NULL),
(24, 'BM', 'Bermuda', 1, NULL, NULL),
(25, 'BT', 'Bhutan', 1, NULL, NULL),
(26, 'BO', 'Bolivia', 1, NULL, NULL),
(27, 'BA', 'Bosnia and Herzegovina', 1, NULL, NULL),
(28, 'BW', 'Botswana', 1, NULL, NULL),
(29, 'BV', 'Bouvet Island', 1, NULL, NULL),
(30, 'BR', 'Brazil', 1, NULL, NULL),
(31, 'IO', 'British Indian Ocean Territory', 1, NULL, NULL),
(32, 'BN', 'Brunei Darussalam', 1, NULL, NULL),
(33, 'BG', 'Bulgaria', 1, NULL, NULL),
(34, 'BF', 'Burkina Faso', 1, NULL, NULL),
(35, 'BI', 'Burundi', 1, NULL, NULL),
(36, 'KH', 'Cambodia', 1, NULL, NULL),
(37, 'CM', 'Cameroon', 1, NULL, NULL),
(38, 'CA', 'Canada', 1, NULL, NULL),
(39, 'CV', 'Cape Verde', 1, NULL, NULL),
(40, 'KY', 'Cayman Islands', 1, NULL, NULL),
(41, 'CF', 'Central African Republic', 1, NULL, NULL),
(42, 'TD', 'Chad', 1, NULL, NULL),
(43, 'CL', 'Chile', 1, NULL, NULL),
(44, 'CN', 'China', 1, NULL, NULL),
(45, 'CX', 'Christmas Island', 1, NULL, NULL),
(46, 'CC', 'Cocos (Keeling) Islands', 1, NULL, NULL),
(47, 'CO', 'Colombia', 1, NULL, NULL),
(48, 'KM', 'Comoros', 1, NULL, NULL),
(49, 'CG', 'Congo', 1, NULL, NULL),
(50, 'CK', 'Cook Islands', 1, NULL, NULL),
(51, 'CR', 'Costa Rica', 1, NULL, NULL),
(52, 'HR', 'Croatia (Hrvatska)', 1, NULL, NULL),
(53, 'CU', 'Cuba', 1, NULL, NULL),
(54, 'CY', 'Cyprus', 1, NULL, NULL),
(55, 'CZ', 'Czech Republic', 1, NULL, NULL),
(56, 'DK', 'Denmark', 1, NULL, NULL),
(57, 'DJ', 'Djibouti', 1, NULL, NULL),
(58, 'DM', 'Dominica', 1, NULL, NULL),
(59, 'DO', 'Dominican Republic', 1, NULL, NULL),
(60, 'TP', 'East Timor', 1, NULL, NULL),
(61, 'EC', 'Ecuador', 1, NULL, NULL),
(62, 'EG', 'Egypt', 1, NULL, NULL),
(63, 'SV', 'El Salvador', 1, NULL, NULL),
(64, 'GQ', 'Equatorial Guinea', 1, NULL, NULL),
(65, 'ER', 'Eritrea', 1, NULL, NULL),
(66, 'EE', 'Estonia', 1, NULL, NULL),
(67, 'ET', 'Ethiopia', 1, NULL, NULL),
(68, 'FK', 'Falkland Islands (Malvinas)', 1, NULL, NULL),
(69, 'FO', 'Faroe Islands', 1, NULL, NULL),
(70, 'FJ', 'Fiji', 1, NULL, NULL),
(71, 'FI', 'Finland', 1, NULL, NULL),
(72, 'FR', 'France', 1, NULL, NULL),
(73, 'FX', 'France, Metropolitan', 1, NULL, NULL),
(74, 'GF', 'French Guiana', 1, NULL, NULL),
(75, 'PF', 'French Polynesia', 1, NULL, NULL),
(76, 'TF', 'French Southern Territories', 1, NULL, NULL),
(77, 'GA', 'Gabon', 1, NULL, NULL),
(78, 'GM', 'Gambia', 1, NULL, NULL),
(79, 'GE', 'Georgia', 1, NULL, NULL),
(80, 'DE', 'Germany', 1, NULL, NULL),
(81, 'GH', 'Ghana', 1, NULL, NULL),
(82, 'GI', 'Gibraltar', 1, NULL, NULL),
(83, 'GK', 'Guernsey', 1, NULL, NULL),
(84, 'GR', 'Greece', 1, NULL, NULL),
(85, 'GL', 'Greenland', 1, NULL, NULL),
(86, 'GD', 'Grenada', 1, NULL, NULL),
(87, 'GP', 'Guadeloupe', 1, NULL, NULL),
(88, 'GU', 'Guam', 1, NULL, NULL),
(89, 'GT', 'Guatemala', 1, NULL, NULL),
(90, 'GN', 'Guinea', 1, NULL, NULL),
(91, 'GW', 'Guinea-Bissau', 1, NULL, NULL),
(92, 'GY', 'Guyana', 1, NULL, NULL),
(93, 'HT', 'Haiti', 1, NULL, NULL),
(94, 'HM', 'Heard and Mc Donald Islands', 1, NULL, NULL),
(95, 'HN', 'Honduras', 1, NULL, NULL),
(96, 'HK', 'Hong Kong', 1, NULL, NULL),
(97, 'HU', 'Hungary', 1, NULL, NULL),
(98, 'IS', 'Iceland', 1, NULL, NULL),
(99, 'IN', 'India', 1, NULL, NULL),
(100, 'IM', 'Isle of Man', 1, NULL, NULL),
(101, 'ID', 'Indonesia', 1, NULL, NULL),
(102, 'IR', 'Iran (Islamic Republic of)', 1, NULL, NULL),
(103, 'IQ', 'Iraq', 1, NULL, NULL),
(104, 'IE', 'Ireland', 1, NULL, NULL),
(105, 'IL', 'Israel', 1, NULL, NULL),
(106, 'IT', 'Italy', 1, NULL, NULL),
(107, 'CI', 'Ivory Coast', 1, NULL, NULL),
(108, 'JE', 'Jersey', 1, NULL, NULL),
(109, 'JM', 'Jamaica', 1, NULL, NULL),
(110, 'JP', 'Japan', 1, NULL, NULL),
(111, 'JO', 'Jordan', 1, NULL, NULL),
(112, 'KZ', 'Kazakhstan', 1, NULL, NULL),
(113, 'KE', 'Kenya', 1, NULL, NULL),
(114, 'KI', 'Kiribati', 1, NULL, NULL),
(115, 'KP', 'Korea, Democratic People\'s Republic of', 1, NULL, NULL),
(116, 'KR', 'Korea, Republic of', 1, NULL, NULL),
(117, 'XK', 'Kosovo', 1, NULL, NULL),
(118, 'KW', 'Kuwait', 1, NULL, NULL),
(119, 'KG', 'Kyrgyzstan', 1, NULL, NULL),
(120, 'LA', 'Lao People\'s Democratic Republic', 1, NULL, NULL),
(121, 'LV', 'Latvia', 1, NULL, NULL),
(122, 'LB', 'Lebanon', 1, NULL, NULL),
(123, 'LS', 'Lesotho', 1, NULL, NULL),
(124, 'LR', 'Liberia', 1, NULL, NULL),
(125, 'LY', 'Libyan Arab Jamahiriya', 1, NULL, NULL),
(126, 'LI', 'Liechtenstein', 1, NULL, NULL),
(127, 'LT', 'Lithuania', 1, NULL, NULL),
(128, 'LU', 'Luxembourg', 1, NULL, NULL),
(129, 'MO', 'Macau', 1, NULL, NULL),
(130, 'MK', 'Macedonia', 1, NULL, NULL),
(131, 'MG', 'Madagascar', 1, NULL, NULL),
(132, 'MW', 'Malawi', 1, NULL, NULL),
(133, 'MY', 'Malaysia', 1, NULL, NULL),
(134, 'MV', 'Maldives', 1, NULL, NULL),
(135, 'ML', 'Mali', 1, NULL, NULL),
(136, 'MT', 'Malta', 1, NULL, NULL),
(137, 'MH', 'Marshall Islands', 1, NULL, NULL),
(138, 'MQ', 'Martinique', 1, NULL, NULL),
(139, 'MR', 'Mauritania', 1, NULL, NULL),
(140, 'MU', 'Mauritius', 1, NULL, NULL),
(141, 'TY', 'Mayotte', 1, NULL, NULL),
(142, 'MX', 'Mexico', 1, NULL, NULL),
(143, 'FM', 'Micronesia, Federated States of', 1, NULL, NULL),
(144, 'MD', 'Moldova, Republic of', 1, NULL, NULL),
(145, 'MC', 'Monaco', 1, NULL, NULL),
(146, 'MN', 'Mongolia', 1, NULL, NULL),
(147, 'ME', 'Montenegro', 1, NULL, NULL),
(148, 'MS', 'Montserrat', 1, NULL, NULL),
(149, 'MA', 'Morocco', 1, NULL, NULL),
(150, 'MZ', 'Mozambique', 1, NULL, NULL),
(151, 'MM', 'Myanmar', 1, NULL, NULL),
(152, 'NA', 'Namibia', 1, NULL, NULL),
(153, 'NR', 'Nauru', 1, NULL, NULL),
(154, 'NP', 'Nepal', 1, NULL, NULL),
(155, 'NL', 'Netherlands', 1, NULL, NULL),
(156, 'AN', 'Netherlands Antilles', 1, NULL, NULL),
(157, 'NC', 'New Caledonia', 1, NULL, NULL),
(158, 'NZ', 'New Zealand', 1, NULL, NULL),
(159, 'NI', 'Nicaragua', 1, NULL, NULL),
(160, 'NE', 'Niger', 1, NULL, NULL),
(161, 'NG', 'Nigeria', 1, NULL, NULL),
(162, 'NU', 'Niue', 1, NULL, NULL),
(163, 'NF', 'Norfolk Island', 1, NULL, NULL),
(164, 'MP', 'Northern Mariana Islands', 1, NULL, NULL),
(165, 'NO', 'Norway', 1, NULL, NULL),
(166, 'OM', 'Oman', 1, NULL, NULL),
(167, 'PK', 'Pakistan', 1, NULL, NULL),
(168, 'PW', 'Palau', 1, NULL, NULL),
(169, 'PS', 'Palestine', 1, NULL, NULL),
(170, 'PA', 'Panama', 1, NULL, NULL),
(171, 'PG', 'Papua New Guinea', 1, NULL, NULL),
(172, 'PY', 'Paraguay', 1, NULL, NULL),
(173, 'PE', 'Peru', 1, NULL, NULL),
(174, 'PH', 'Philippines', 1, NULL, NULL),
(175, 'PN', 'Pitcairn', 1, NULL, NULL),
(176, 'PL', 'Poland', 1, NULL, NULL),
(177, 'PT', 'Portugal', 1, NULL, NULL),
(178, 'PR', 'Puerto Rico', 1, NULL, NULL),
(179, 'QA', 'Qatar', 1, NULL, NULL),
(180, 'RE', 'Reunion', 1, NULL, NULL),
(181, 'RO', 'Romania', 1, NULL, NULL),
(182, 'RU', 'Russian Federation', 1, NULL, NULL),
(183, 'RW', 'Rwanda', 1, NULL, NULL),
(184, 'KN', 'Saint Kitts and Nevis', 1, NULL, NULL),
(185, 'LC', 'Saint Lucia', 1, NULL, NULL),
(186, 'VC', 'Saint Vincent and the Grenadines', 1, NULL, NULL),
(187, 'WS', 'Samoa', 1, NULL, NULL),
(188, 'SM', 'San Marino', 1, NULL, NULL),
(189, 'ST', 'Sao Tome and Principe', 1, NULL, NULL),
(190, 'SA', 'Saudi Arabia', 1, NULL, NULL),
(191, 'SN', 'Senegal', 1, NULL, NULL),
(192, 'RS', 'Serbia', 1, NULL, NULL),
(193, 'SC', 'Seychelles', 1, NULL, NULL),
(194, 'SL', 'Sierra Leone', 1, NULL, NULL),
(195, 'SG', 'Singapore', 1, NULL, NULL),
(196, 'SK', 'Slovakia', 1, NULL, NULL),
(197, 'SI', 'Slovenia', 1, NULL, NULL),
(198, 'SB', 'Solomon Islands', 1, NULL, NULL),
(199, 'SO', 'Somalia', 1, NULL, NULL),
(200, 'ZA', 'South Africa', 1, NULL, NULL),
(201, 'GS', 'South Georgia South Sandwich Islands', 1, NULL, NULL),
(202, 'SS', 'South Sudan', 1, NULL, NULL),
(203, 'ES', 'Spain', 1, NULL, NULL),
(204, 'LK', 'Sri Lanka', 1, NULL, NULL),
(205, 'SH', 'St. Helena', 1, NULL, NULL),
(206, 'PM', 'St. Pierre and Miquelon', 1, NULL, NULL),
(207, 'SD', 'Sudan', 1, NULL, NULL),
(208, 'SR', 'Suriname', 1, NULL, NULL),
(209, 'SJ', 'Svalbard and Jan Mayen Islands', 1, NULL, NULL),
(210, 'SZ', 'Swaziland', 1, NULL, NULL),
(211, 'SE', 'Sweden', 1, NULL, NULL),
(212, 'CH', 'Switzerland', 1, NULL, NULL),
(213, 'SY', 'Syrian Arab Republic', 1, NULL, NULL),
(214, 'TW', 'Taiwan', 1, NULL, NULL),
(215, 'TJ', 'Tajikistan', 1, NULL, NULL),
(216, 'TZ', 'Tanzania, United Republic of', 1, NULL, NULL),
(217, 'TH', 'Thailand', 1, NULL, NULL),
(218, 'TG', 'Togo', 1, NULL, NULL),
(219, 'TK', 'Tokelau', 1, NULL, NULL),
(220, 'TO', 'Tonga', 1, NULL, NULL),
(221, 'TT', 'Trinidad and Tobago', 1, NULL, NULL),
(222, 'TN', 'Tunisia', 1, NULL, NULL),
(223, 'TR', 'Turkey', 1, NULL, NULL),
(224, 'TM', 'Turkmenistan', 1, NULL, NULL),
(225, 'TC', 'Turks and Caicos Islands', 1, NULL, NULL),
(226, 'TV', 'Tuvalu', 1, NULL, NULL),
(227, 'UG', 'Uganda', 1, NULL, NULL),
(228, 'UA', 'Ukraine', 1, NULL, NULL),
(229, 'AE', 'United Arab Emirates', 1, NULL, NULL),
(230, 'GB', 'United Kingdom', 1, NULL, NULL),
(231, 'US', 'United States', 1, NULL, NULL),
(232, 'UM', 'United States minor outlying islands', 1, NULL, NULL),
(233, 'UY', 'Uruguay', 1, NULL, NULL),
(234, 'UZ', 'Uzbekistan', 1, NULL, NULL),
(235, 'VU', 'Vanuatu', 1, NULL, NULL),
(236, 'VA', 'Vatican City State', 1, NULL, NULL),
(237, 'VE', 'Venezuela', 1, NULL, NULL),
(238, 'VN', 'Vietnam', 1, NULL, NULL),
(239, 'VG', 'Virgin Islands (British)', 1, NULL, NULL),
(240, 'VI', 'Virgin Islands (U.S.)', 1, NULL, NULL),
(241, 'WF', 'Wallis and Futuna Islands', 1, NULL, NULL),
(242, 'EH', 'Western Sahara', 1, NULL, NULL),
(243, 'YE', 'Yemen', 1, NULL, NULL),
(244, 'ZR', 'Zaire', 1, NULL, NULL),
(245, 'ZM', 'Zambia', 1, NULL, NULL),
(246, 'ZW', 'Zimbabwe', 1, NULL, NULL),
(247, 'AF', 'Afghanistan', 1, NULL, NULL),
(248, 'AL', 'Albania', 1, NULL, NULL),
(249, 'DZ', 'Algeria', 1, NULL, NULL),
(250, 'DS', 'American Samoa', 1, NULL, NULL),
(251, 'AD', 'Andorra', 1, NULL, NULL),
(252, 'AO', 'Angola', 1, NULL, NULL),
(253, 'AI', 'Anguilla', 1, NULL, NULL),
(254, 'AQ', 'Antarctica', 1, NULL, NULL),
(255, 'AG', 'Antigua and Barbuda', 1, NULL, NULL),
(256, 'AR', 'Argentina', 1, NULL, NULL),
(257, 'AM', 'Armenia', 1, NULL, NULL),
(258, 'AW', 'Aruba', 1, NULL, NULL),
(259, 'AU', 'Australia', 1, NULL, NULL),
(260, 'AT', 'Austria', 1, NULL, NULL),
(261, 'AZ', 'Azerbaijan', 1, NULL, NULL),
(262, 'BS', 'Bahamas', 1, NULL, NULL),
(263, 'BH', 'Bahrain', 1, NULL, NULL),
(264, 'BD', 'Bangladesh', 1, NULL, NULL),
(265, 'BB', 'Barbados', 1, NULL, NULL),
(266, 'BY', 'Belarus', 1, NULL, NULL),
(267, 'BE', 'Belgium', 1, NULL, NULL),
(268, 'BZ', 'Belize', 1, NULL, NULL),
(269, 'BJ', 'Benin', 1, NULL, NULL),
(270, 'BM', 'Bermuda', 1, NULL, NULL),
(271, 'BT', 'Bhutan', 1, NULL, NULL),
(272, 'BO', 'Bolivia', 1, NULL, NULL),
(273, 'BA', 'Bosnia and Herzegovina', 1, NULL, NULL),
(274, 'BW', 'Botswana', 1, NULL, NULL),
(275, 'BV', 'Bouvet Island', 1, NULL, NULL),
(276, 'BR', 'Brazil', 1, NULL, NULL),
(277, 'IO', 'British Indian Ocean Territory', 1, NULL, NULL),
(278, 'BN', 'Brunei Darussalam', 1, NULL, NULL),
(279, 'BG', 'Bulgaria', 1, NULL, NULL),
(280, 'BF', 'Burkina Faso', 1, NULL, NULL),
(281, 'BI', 'Burundi', 1, NULL, NULL),
(282, 'KH', 'Cambodia', 1, NULL, NULL),
(283, 'CM', 'Cameroon', 1, NULL, NULL),
(284, 'CA', 'Canada', 1, NULL, NULL),
(285, 'CV', 'Cape Verde', 1, NULL, NULL),
(286, 'KY', 'Cayman Islands', 1, NULL, NULL),
(287, 'CF', 'Central African Republic', 1, NULL, NULL),
(288, 'TD', 'Chad', 1, NULL, NULL),
(289, 'CL', 'Chile', 1, NULL, NULL),
(290, 'CN', 'China', 1, NULL, NULL),
(291, 'CX', 'Christmas Island', 1, NULL, NULL),
(292, 'CC', 'Cocos (Keeling) Islands', 1, NULL, NULL),
(293, 'CO', 'Colombia', 1, NULL, NULL),
(294, 'KM', 'Comoros', 1, NULL, NULL),
(295, 'CG', 'Congo', 1, NULL, NULL),
(296, 'CK', 'Cook Islands', 1, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `coupons`
--

CREATE TABLE `coupons` (
  `id` int(11) NOT NULL,
  `type` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `details` longtext COLLATE utf8_unicode_ci NOT NULL,
  `discount` double(8,2) NOT NULL,
  `discount_type` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `start_date` int(15) NOT NULL,
  `end_date` int(15) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `coupons`
--

INSERT INTO `coupons` (`id`, `type`, `code`, `details`, `discount`, `discount_type`, `start_date`, `end_date`, `created_at`, `updated_at`) VALUES
(1, 'cart_base', 'V4LOCAL10', '{\"min_buy\":\"1000\",\"max_discount\":\"100\"}', 10.00, 'percent', 1605637800, 1606674600, '2020-11-18 23:46:09', '2020-11-19 22:52:46');

-- --------------------------------------------------------

--
-- Table structure for table `coupon_usages`
--

CREATE TABLE `coupon_usages` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `coupon_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `currencies`
--

CREATE TABLE `currencies` (
  `id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `symbol` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `exchange_rate` double(10,5) NOT NULL,
  `status` int(10) NOT NULL DEFAULT '0',
  `code` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `currencies`
--

INSERT INTO `currencies` (`id`, `name`, `symbol`, `exchange_rate`, `status`, `code`, `created_at`, `updated_at`) VALUES
(1, 'U.S. Dollar', '$', 1.00000, 1, 'USD', '2018-10-09 11:35:08', '2018-10-17 05:50:52'),
(2, 'Australian Dollar', '$', 1.28000, 1, 'AUD', '2018-10-09 11:35:08', '2019-02-04 05:51:55'),
(5, 'Brazilian Real', 'R$', 3.25000, 1, 'BRL', '2018-10-09 11:35:08', '2018-10-17 05:51:00'),
(6, 'Canadian Dollar', '$', 1.27000, 1, 'CAD', '2018-10-09 11:35:08', '2018-10-09 11:35:08'),
(7, 'Czech Koruna', 'Kč', 20.65000, 1, 'CZK', '2018-10-09 11:35:08', '2018-10-09 11:35:08'),
(8, 'Danish Krone', 'kr', 6.05000, 1, 'DKK', '2018-10-09 11:35:08', '2018-10-09 11:35:08'),
(9, 'Euro', '€', 0.85000, 1, 'EUR', '2018-10-09 11:35:08', '2018-10-09 11:35:08'),
(10, 'Hong Kong Dollar', '$', 7.83000, 1, 'HKD', '2018-10-09 11:35:08', '2018-10-09 11:35:08'),
(11, 'Hungarian Forint', 'Ft', 255.24000, 1, 'HUF', '2018-10-09 11:35:08', '2018-10-09 11:35:08'),
(12, 'Israeli New Sheqel', '₪', 3.48000, 1, 'ILS', '2018-10-09 11:35:08', '2018-10-09 11:35:08'),
(13, 'Japanese Yen', '¥', 107.12000, 1, 'JPY', '2018-10-09 11:35:08', '2018-10-09 11:35:08'),
(14, 'Malaysian Ringgit', 'RM', 3.91000, 1, 'MYR', '2018-10-09 11:35:08', '2018-10-09 11:35:08'),
(15, 'Mexican Peso', '$', 18.72000, 1, 'MXN', '2018-10-09 11:35:08', '2018-10-09 11:35:08'),
(16, 'Norwegian Krone', 'kr', 7.83000, 1, 'NOK', '2018-10-09 11:35:08', '2018-10-09 11:35:08'),
(17, 'New Zealand Dollar', '$', 1.38000, 1, 'NZD', '2018-10-09 11:35:08', '2018-10-09 11:35:08'),
(18, 'Philippine Peso', '₱', 52.26000, 1, 'PHP', '2018-10-09 11:35:08', '2018-10-09 11:35:08'),
(19, 'Polish Zloty', 'zł', 3.39000, 1, 'PLN', '2018-10-09 11:35:08', '2018-10-09 11:35:08'),
(20, 'Pound Sterling', '£', 0.72000, 1, 'GBP', '2018-10-09 11:35:08', '2018-10-09 11:35:08'),
(21, 'Russian Ruble', 'руб', 55.93000, 1, 'RUB', '2018-10-09 11:35:08', '2018-10-09 11:35:08'),
(22, 'Singapore Dollar', '$', 1.32000, 1, 'SGD', '2018-10-09 11:35:08', '2018-10-09 11:35:08'),
(23, 'Swedish Krona', 'kr', 8.19000, 1, 'SEK', '2018-10-09 11:35:08', '2018-10-09 11:35:08'),
(24, 'Swiss Franc', 'CHF', 0.94000, 1, 'CHF', '2018-10-09 11:35:08', '2018-10-09 11:35:08'),
(26, 'Thai Baht', '฿', 31.39000, 1, 'THB', '2018-10-09 11:35:08', '2018-10-09 11:35:08'),
(27, 'Taka', '৳', 84.00000, 1, 'BDT', '2018-10-09 11:35:08', '2018-12-02 05:16:13'),
(28, 'Indian Rupee', 'Rs', 68.45000, 1, 'Rupee', '2019-07-07 10:33:46', '2019-07-07 10:33:46');

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `user_id`, `created_at`, `updated_at`) VALUES
(4, 8, '2019-08-01 10:35:09', '2019-08-01 10:35:09'),
(5, 12, '2020-11-12 15:50:33', '2020-11-12 15:50:33'),
(6, 14, '2020-11-16 16:14:30', '2020-11-16 16:14:30'),
(7, 15, '2020-11-16 22:04:34', '2020-11-16 22:04:34'),
(8, 16, '2020-11-16 23:10:05', '2020-11-16 23:10:05'),
(9, 17, '2020-11-16 23:31:56', '2020-11-16 23:31:56'),
(10, 18, '2020-11-17 10:34:16', '2020-11-17 10:34:16'),
(11, 19, '2020-11-17 17:52:27', '2020-11-17 17:52:27'),
(13, 23, '2020-11-21 16:35:53', '2020-11-21 16:35:53'),
(14, 28, '2020-11-24 15:11:25', '2020-11-24 15:11:25'),
(15, 29, '2020-11-24 17:50:53', '2020-11-24 17:50:53'),
(20, 37, '2020-11-28 11:58:41', '2020-11-28 11:58:41'),
(21, 38, '2020-11-28 12:41:03', '2020-11-28 12:41:03'),
(22, 39, '2020-11-28 13:28:18', '2020-11-28 13:28:18'),
(23, 40, '2020-11-28 13:51:02', '2020-11-28 13:51:02'),
(24, 41, '2020-11-28 21:37:31', '2020-11-28 21:37:31'),
(25, 42, '2020-11-29 11:55:12', '2020-11-29 11:55:12'),
(26, 43, '2020-11-29 13:20:49', '2020-11-29 13:20:49'),
(27, 44, '2020-11-29 14:11:39', '2020-11-29 14:11:39'),
(28, 45, '2020-11-29 16:16:31', '2020-11-29 16:16:31'),
(29, 46, '2020-11-29 20:43:56', '2020-11-29 20:43:56'),
(30, 47, '2020-11-29 22:59:10', '2020-11-29 22:59:10'),
(31, 48, '2020-11-30 08:58:31', '2020-11-30 08:58:31'),
(32, 49, '2020-12-04 19:44:46', '2020-12-04 19:44:46'),
(33, 50, '2020-12-05 11:23:08', '2020-12-05 11:23:08'),
(34, 51, '2020-12-07 13:23:56', '2020-12-07 13:23:56'),
(35, 56, '2020-12-18 11:03:27', '2020-12-18 11:03:27'),
(36, 59, '2020-12-23 00:00:56', '2020-12-23 00:00:56'),
(37, 62, '2022-02-07 16:49:22', '2022-02-07 16:49:22');

-- --------------------------------------------------------

--
-- Table structure for table `customer_packages`
--

CREATE TABLE `customer_packages` (
  `id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `amount` double(28,2) DEFAULT NULL,
  `product_upload` int(11) DEFAULT NULL,
  `logo` varchar(150) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer_package_payments`
--

CREATE TABLE `customer_package_payments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `customer_package_id` int(11) NOT NULL,
  `payment_method` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `payment_details` longtext COLLATE utf8_unicode_ci NOT NULL,
  `approval` int(1) NOT NULL,
  `offline_payment` int(1) NOT NULL COMMENT '1=offline payment\r\n2=online paymnet',
  `reciept` varchar(150) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer_products`
--

CREATE TABLE `customer_products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `published` int(1) NOT NULL DEFAULT '0',
  `status` int(1) NOT NULL DEFAULT '0',
  `added_by` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `subcategory_id` int(11) DEFAULT NULL,
  `subsubcategory_id` int(11) DEFAULT NULL,
  `brand_id` int(11) DEFAULT NULL,
  `photos` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `thumbnail_img` varchar(150) COLLATE utf8_unicode_ci DEFAULT NULL,
  `conditon` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `location` text COLLATE utf8_unicode_ci,
  `video_provider` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `video_link` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `unit` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `tags` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` mediumtext COLLATE utf8_unicode_ci,
  `unit_price` double(28,2) DEFAULT '0.00',
  `meta_title` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `meta_description` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL,
  `meta_img` varchar(150) COLLATE utf8_unicode_ci DEFAULT NULL,
  `pdf` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `slug` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `flash_deals`
--

CREATE TABLE `flash_deals` (
  `id` int(11) NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `start_date` int(20) DEFAULT NULL,
  `end_date` int(20) DEFAULT NULL,
  `status` int(1) NOT NULL DEFAULT '0',
  `featured` int(1) NOT NULL DEFAULT '0',
  `background_color` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `text_color` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `banner` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `slug` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `flash_deal_products`
--

CREATE TABLE `flash_deal_products` (
  `id` int(11) NOT NULL,
  `flash_deal_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `discount` double(8,2) DEFAULT '0.00',
  `discount_type` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `general_settings`
--

CREATE TABLE `general_settings` (
  `id` int(11) NOT NULL,
  `frontend_color` varchar(255) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'default',
  `logo` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `footer_logo` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `admin_logo` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `admin_login_background` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `admin_login_sidebar` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `favicon` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `site_name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `address` varchar(1000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` mediumtext COLLATE utf8_unicode_ci NOT NULL,
  `phone` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `facebook` varchar(1000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `instagram` varchar(1000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `twitter` varchar(1000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `youtube` varchar(1000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `google_plus` varchar(1000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `general_settings`
--

INSERT INTO `general_settings` (`id`, `frontend_color`, `logo`, `footer_logo`, `admin_logo`, `admin_login_background`, `admin_login_sidebar`, `favicon`, `site_name`, `address`, `description`, `phone`, `email`, `facebook`, `instagram`, `twitter`, `youtube`, `google_plus`, `created_at`, `updated_at`) VALUES
(1, '4', 'uploads/logo/bSZmopHJszcHsWOTaOFrPqXyllGklHcVMtqAViNp.png', 'uploads/logo/8mm5lpy3vD52ZpU6PHWsIgmQkefUkPZzqwdtocHQ.png', 'uploads/admin_logo/QUste38Wg1vwlRCCqrrR7eqzKqf5Kk292c7Dmfy5.png', NULL, 'uploads/admin_login_sidebar/FR3EFiC7QhkJ9eItWgPhElVSPLxuibnpnr41wAWE.png', 'uploads/favicon/p7b241d9OM63gxwX72zXg9chy4fjlqg85Hq3UQ7u.jpeg', 'PHPStore - Be Vocal for Local - Digital India', 'Pisoli, Pune', 'V4local is product listing service where local sellers, housewives can list their product and share link on social media.', '+918271897347', 'phpsoftwarestore@gmail.com', 'https://www.facebook.com/phpstore.in', 'https://www.instagram.com', 'https://www.twitter.com', 'https://www.youtube.com', 'https://www.googleplus.com', '2022-02-22 08:57:45', '2022-02-22 14:27:45');

-- --------------------------------------------------------

--
-- Table structure for table `home_categories`
--

CREATE TABLE `home_categories` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `subsubcategories` varchar(1000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `status` int(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `home_categories`
--

INSERT INTO `home_categories` (`id`, `category_id`, `subsubcategories`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, '[\"1\"]', 1, '2019-03-12 06:38:23', '2019-03-12 06:38:23'),
(2, 2, '[\"10\"]', 1, '2019-03-12 06:44:54', '2019-03-12 06:44:54'),
(3, 4, 'null', 1, '2020-11-16 17:01:35', '2020-11-16 17:01:35'),
(4, 5, 'null', 1, '2020-11-16 17:01:47', '2020-11-16 17:01:47'),
(5, 3, 'null', 1, '2020-11-16 17:01:58', '2020-11-16 17:01:58');

-- --------------------------------------------------------

--
-- Table structure for table `languages`
--

CREATE TABLE `languages` (
  `id` int(11) NOT NULL,
  `name` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `code` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  `rtl` int(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `languages`
--

INSERT INTO `languages` (`id`, `name`, `code`, `rtl`, `created_at`, `updated_at`) VALUES
(1, 'English', 'en', 0, '2019-01-20 12:13:20', '2019-01-20 12:13:20'),
(3, 'Bangla', 'bd', 0, '2019-02-17 06:35:37', '2019-02-18 06:49:51'),
(4, 'Arabic', 'sa', 1, '2019-04-28 18:34:12', '2019-04-28 18:34:12');

-- --------------------------------------------------------

--
-- Table structure for table `links`
--

CREATE TABLE `links` (
  `id` int(11) NOT NULL,
  `name` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `url` varchar(200) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `links`
--

INSERT INTO `links` (`id`, `name`, `url`, `created_at`, `updated_at`) VALUES
(1, 'Click here to download our APP', 'https://play.google.com/store/apps/details?id=com.vlocal.shopping', '2020-11-16 19:23:04', '2020-11-17 00:53:04'),
(2, 'Facebook', 'https://www.facebook.com/vokal4local/', '2020-11-24 15:06:26', '2020-11-24 15:06:26'),
(4, 'Instagram', 'https://www.instagram.com/v4local/', '2020-11-24 15:07:16', '2020-11-24 15:07:16');

-- --------------------------------------------------------

--
-- Table structure for table `manual_payment_methods`
--

CREATE TABLE `manual_payment_methods` (
  `id` int(11) NOT NULL,
  `type` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `heading` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `bank_info` text COLLATE utf8_unicode_ci,
  `photo` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `conversation_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text COLLATE utf32_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf32 COLLATE=utf32_unicode_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `conversation_id`, `user_id`, `message`, `created_at`, `updated_at`) VALUES
(1, 1, 12, 'https://v4local.in/product/Winter-wear-TynIf', '2020-11-12 16:04:49', '2020-11-12 16:04:49'),
(2, 1, 9, 'Thanks for the message.', '2020-11-12 16:07:46', '2020-11-12 16:07:46'),
(3, 2, 47, 'https://v4local.in/product/Alloy-Womens-Earrings-yMMne\r\nWhat is the final price?', '2020-11-29 23:00:09', '2020-11-29 23:00:09'),
(4, 2, 35, '300 final price', '2020-11-29 23:01:14', '2020-11-29 23:01:14');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(191) COLLATE utf8_unicode_ci NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2014_10_12_000000_create_users_table', 1),
(2, '2014_10_12_100000_create_password_resets_table', 1);

-- --------------------------------------------------------

--
-- Table structure for table `oauth_access_tokens`
--

CREATE TABLE `oauth_access_tokens` (
  `id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `client_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scopes` text COLLATE utf8mb4_unicode_ci,
  `revoked` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `oauth_access_tokens`
--

INSERT INTO `oauth_access_tokens` (`id`, `user_id`, `client_id`, `name`, `scopes`, `revoked`, `created_at`, `updated_at`, `expires_at`) VALUES
('0258f17012967f34df8b0fae000312cbb27e45840157eacae42cbaf313fcaff876b74ff4ec61b039', 38, 1, 'Personal Access Token', '[]', 1, '2020-11-28 13:27:54', '2020-11-28 13:27:54', '2022-10-29 13:27:54'),
('09ae8a61d9acd58e54cdac8137e1699fca9746c5978f3e6a0b02ce946e530cdfe8c8449bab870204', 13, 1, 'Personal Access Token', '[]', 1, '2020-11-17 08:43:58', '2020-11-17 08:43:58', '2022-10-18 08:43:58'),
('0b3699d7eb3189d2012f02acbc3d23ba789beb0e396d4d6c504742ef998dabbe0cb04ac73055bbb9', 35, 1, 'Personal Access Token', '[]', 1, '2020-11-30 15:27:54', '2020-11-30 15:27:54', '2022-10-31 15:27:55'),
('0cbe29d99d465e6aaa767a1fbfed791766542f732c620e3bb17a601f1e98ecf1fc5bd95f764229d8', 15, 1, 'Personal Access Token', '[]', 1, '2020-11-16 23:03:21', '2020-11-16 23:03:21', '2022-10-17 23:03:21'),
('125ce8289850f80d9fea100325bf892fbd0deba1f87dbfc2ab81fb43d57377ec24ed65f7dc560e46', 1, 1, 'Personal Access Token', '[]', 0, '2019-07-30 04:51:13', '2019-07-30 04:51:13', '2020-07-30 10:51:13'),
('131a1d22ca2c1946d3c801c4e585a4dc5a4aae0ae7507dd726638597290984e6f046563dddbb0dc4', 15, 1, 'Personal Access Token', '[]', 1, '2020-11-16 23:30:38', '2020-11-16 23:30:38', '2022-10-17 23:30:38'),
('185eaedcc60841fee82f79a211dd9858fa6743b786e182407ed3b0fd932dfa1ae07c82f4c00d1fd1', 23, 1, 'Personal Access Token', '[]', 0, '2020-11-21 16:36:15', '2020-11-21 16:36:15', '2022-10-22 16:36:15'),
('1a4a65644c3be721c74a9b28c72a4e14de5fc6658d4ae709aadebfc477d6fd363477645c7a0b9dbf', 17, 1, 'Personal Access Token', '[]', 0, '2020-11-16 23:44:46', '2020-11-16 23:44:46', '2022-10-17 23:44:46'),
('1ceafdc97a08e7f6ec45f083221d64cc6b9b0546b3682984dde7b72e1238d7eb94ebe353b11073f9', 13, 1, 'Personal Access Token', '[]', 1, '2020-11-17 08:39:16', '2020-11-17 08:39:16', '2022-10-18 08:39:16'),
('261847cd1c3de8d6831f537a7dac59fff0b8bf4ad8b445e401aa828cc7168925c2a21d39de68c145', 38, 1, 'Personal Access Token', '[]', 1, '2020-11-28 12:41:03', '2020-11-28 12:41:03', '2022-10-29 12:41:03'),
('293d2bb534220c070c4e90d25b5509965d23d3ddbc05b1e29fb4899ae09420ff112dbccab1c6f504', 1, 1, 'Personal Access Token', '[]', 1, '2019-08-04 06:00:04', '2019-08-04 06:00:04', '2020-08-04 12:00:04'),
('2a4828379cd1098f79a5878baeba76567fb27a0297394a6d6ed367498723b18b1fee2e5a0f2db485', 17, 1, 'Personal Access Token', '[]', 0, '2020-11-16 23:53:25', '2020-11-16 23:53:25', '2022-10-17 23:53:25'),
('31b3dce09cc88c61f76a4c377aa966442fdbd620b117cc71f119223b324ca98add4ad062970ff576', 37, 1, 'Personal Access Token', '[]', 1, '2020-11-28 11:58:41', '2020-11-28 11:58:41', '2022-10-29 11:58:41'),
('34f5657a9d999a8c0075fe13c565b948e6f946e070248fdc5e1f473e1bdee2ea103e399b825ae6fd', 44, 1, 'Personal Access Token', '[]', 0, '2020-11-29 14:11:40', '2020-11-29 14:11:40', '2022-10-30 14:11:40'),
('35a62f3874ec6d143766a94454bae5eaa5a9177e2e3b5c4dd24fa8a79522f9dd4d4762d42614afb8', 59, 1, 'Personal Access Token', '[]', 0, '2020-12-23 00:00:56', '2020-12-23 00:00:56', '2022-11-23 00:00:56'),
('3a7b2942020258f850a2c2ccde7af7efc99924b8b99ecc89fdc1c888380253fb0811c3d440f3315d', 52, 1, 'Personal Access Token', '[]', 0, '2020-12-29 19:17:54', '2020-12-29 19:17:54', '2022-11-29 19:17:54'),
('478ad4346e9c15a4c3721eb762a7c2878bbb16727fb2676668c3b3e48cbb4765719e06abbf21e271', 17, 1, 'Personal Access Token', '[]', 1, '2020-11-28 13:35:14', '2020-11-28 13:35:14', '2022-10-29 13:35:14'),
('4a268f82da7d5f927c2cdb76bc5742ebf4b4aba345c3935b403ac5c20e5920c68985fc92999a3d79', 17, 1, 'Personal Access Token', '[]', 0, '2020-11-28 13:26:29', '2020-11-28 13:26:29', '2022-10-29 13:26:29'),
('4fb7eba937a83aa7ad8138ff909b4c0ca9af12bfba1713dc844ee5477073756cfbcc2c2f1d0248ef', 38, 1, 'Personal Access Token', '[]', 1, '2020-11-28 12:41:22', '2020-11-28 12:41:22', '2022-10-29 12:41:22'),
('5363e91c7892acdd6417aa9c7d4987d83568e229befbd75be64282dbe8a88147c6c705e06c1fb2bf', 1, 1, 'Personal Access Token', '[]', 0, '2019-07-13 06:44:28', '2019-07-13 06:44:28', '2020-07-13 12:44:28'),
('546f222164670fe8303e5d8f4a00ae08c0a5a31643de26fd999a98fdd50aab01f1b10ef2e241e934', 49, 1, 'Personal Access Token', '[]', 0, '2020-12-04 19:44:46', '2020-12-04 19:44:46', '2022-11-04 19:44:46'),
('57be65db080467530aee96e4779a93c8767ee497d5e55ba64ca0891670c0459f61b4593231b4273e', 13, 1, 'Personal Access Token', '[]', 0, '2020-12-05 11:08:17', '2020-12-05 11:08:17', '2022-11-05 11:08:17'),
('59a161f544e3c64e90c1638fade476d44677bdf5a489c5f98bf3b5fed8de292cda456d046d757811', 46, 1, 'Personal Access Token', '[]', 0, '2020-11-29 20:43:57', '2020-11-29 20:43:57', '2022-10-30 20:43:57'),
('5e75dd9884b70cde853dfbfa2163e707c57538d83480861d18d40b5d0a40717fff95e2fd1c30280c', 17, 1, 'Personal Access Token', '[]', 1, '2020-11-16 23:37:03', '2020-11-16 23:37:03', '2022-10-17 23:37:03'),
('5f71168d1f21e0b8d8523a6e77acff9b3a18c91a31d38cb66f40a165e0d09bda14bfb357605417d1', 13, 1, 'Personal Access Token', '[]', 0, '2020-11-17 08:39:15', '2020-11-17 08:39:15', '2022-10-18 08:39:15'),
('642bf976c5415898fa4080f10c1e7c0a9178f37d836ccee3e2a3d20d7f5204d526ff91b31e706a9e', 40, 1, 'Personal Access Token', '[]', 0, '2020-11-28 13:51:02', '2020-11-28 13:51:02', '2022-10-29 13:51:02'),
('681b4a4099fac5e12517307b4027b54df94cbaf0cbf6b4bf496534c94f0ccd8a79dd6af9742d076b', 1, 1, 'Personal Access Token', '[]', 1, '2019-08-04 07:23:06', '2019-08-04 07:23:06', '2020-08-04 13:23:06'),
('6d229e3559e568df086c706a1056f760abc1370abe74033c773490581a042442154afa1260c4b6f0', 1, 1, 'Personal Access Token', '[]', 1, '2019-08-04 07:32:12', '2019-08-04 07:32:12', '2020-08-04 13:32:12'),
('6efc0f1fc3843027ea1ea7cd35acf9c74282f0271c31d45a164e7b27025a315d31022efe7bb94aaa', 1, 1, 'Personal Access Token', '[]', 0, '2019-08-08 02:35:26', '2019-08-08 02:35:26', '2020-08-08 08:35:26'),
('6f9c15cbbc9c6180c217ddee0bc3e35ffb76e6c0b61a9eb0672e8bb123af16ecdddb8a68e3bb332d', 11, 1, 'Personal Access Token', '[]', 1, '2020-11-17 11:02:21', '2020-11-17 11:02:21', '2022-10-18 11:02:21'),
('7745b763da15a06eaded371330072361b0524c41651cf48bf76fc1b521a475ece78703646e06d3b0', 1, 1, 'Personal Access Token', '[]', 1, '2019-08-04 07:29:44', '2019-08-04 07:29:44', '2020-08-04 13:29:44'),
('815b625e239934be293cd34479b0f766bbc1da7cc10d464a2944ddce3a0142e943ae48be018ccbd0', 1, 1, 'Personal Access Token', '[]', 1, '2019-07-22 02:07:47', '2019-07-22 02:07:47', '2020-07-22 08:07:47'),
('820b8f5a73efd0cd4d6219fc0d97a24357a8ffff2d299f386dd2f3d547d086b78f4fc3ffc10056be', 17, 1, 'Personal Access Token', '[]', 1, '2020-11-28 13:26:29', '2020-11-28 13:26:29', '2022-10-29 13:26:29'),
('8323f753a744b26511593602ad25e4713226f3ba1a867ed9de82bb945efcdbaf3fb437c75ae63841', 17, 1, 'Personal Access Token', '[]', 1, '2020-11-16 23:34:42', '2020-11-16 23:34:42', '2022-10-17 23:34:42'),
('845d18d124238b86f2b95b75cf1689ce731fe5b8910a569c88505161198078f593324c6ec4e2e5f7', 11, 1, 'Personal Access Token', '[]', 1, '2020-11-19 22:29:31', '2020-11-19 22:29:31', '2022-10-20 22:29:31'),
('8658ba16c20ec1b88d32dff04b1f0d90e77f34a83311d4333a10ca9d82e46e7edd374188bfcceb2a', 17, 1, 'Personal Access Token', '[]', 1, '2020-11-17 00:14:22', '2020-11-17 00:14:22', '2022-10-18 00:14:22'),
('8921a4c96a6d674ac002e216f98855c69de2568003f9b4136f6e66f4cb9545442fb3e37e91a27cad', 1, 1, 'Personal Access Token', '[]', 1, '2019-08-04 06:05:05', '2019-08-04 06:05:05', '2020-08-04 12:05:05'),
('8d8b85720304e2f161a66564cec0ecd50d70e611cc0efbf04e409330086e6009f72a39ce2191f33a', 1, 1, 'Personal Access Token', '[]', 1, '2019-08-04 06:44:35', '2019-08-04 06:44:35', '2020-08-04 12:44:35'),
('8edbd657db5d5dc31a4a16de4e7a4a843cb09bebf63346705c299254a977bfd8a4126ed20fb7697d', 41, 1, 'Personal Access Token', '[]', 0, '2021-01-23 14:48:14', '2021-01-23 14:48:14', '2022-12-24 14:48:14'),
('902b1274e029a94a2d68bdd35bd4a80e12d1b7258d9c11a1387a2f856cdec0b227297ec943c52483', 18, 1, 'Personal Access Token', '[]', 0, '2020-11-17 10:34:30', '2020-11-17 10:34:30', '2022-10-18 10:34:30'),
('9901b9208f7e070a38cefd7273194faaea85513cf08685eeab30dbb57f729d624d4980338b32a31f', 38, 1, 'Personal Access Token', '[]', 1, '2020-11-28 12:46:15', '2020-11-28 12:46:15', '2022-10-29 12:46:15'),
('a7a52c0f533f54cea50334bd85c844fa0af4fc14ca1d55b84850e55be4fbea8845fa02b50d4f99c9', 11, 1, 'Personal Access Token', '[]', 0, '2020-12-10 22:31:00', '2020-12-10 22:31:00', '2022-11-10 22:31:00'),
('aacacb5050b47d685d100b45c97cc00e5b92a4c578c766d7e744de28b76f516901590750e49729ac', 45, 1, 'Personal Access Token', '[]', 0, '2020-11-29 16:16:31', '2020-11-29 16:16:31', '2022-10-30 16:16:31'),
('acb1c8f2605d2e050758545141b2e346892ac2b64f52e47e6ea224942365eae2c6780a1e539bb693', 35, 1, 'Personal Access Token', '[]', 0, '2020-11-30 15:28:34', '2020-11-30 15:28:34', '2022-10-31 15:28:34'),
('b07401e71dad5fe315b4a37e546bac3b72f701d25410aee46b3f3c603d3f4df23d09f78c10d99082', 38, 1, 'Personal Access Token', '[]', 1, '2020-11-28 13:20:49', '2020-11-28 13:20:49', '2022-10-29 13:20:49'),
('b8bc662ef274777e4ebc4e46cb0c567eaa36e79f66e7195dbfef4573e9599a04c1caa5c4615255ee', 42, 1, 'Personal Access Token', '[]', 0, '2020-11-29 11:55:12', '2020-11-29 11:55:12', '2022-10-30 11:55:12'),
('bb06b559c04c801753efff23be955c2f3c0fd6dca9deb7511e1999bbab720f9825008bec2eb593da', 17, 1, 'Personal Access Token', '[]', 0, '2020-11-16 23:51:57', '2020-11-16 23:51:57', '2022-10-17 23:51:57'),
('bcaaebdead4c0ef15f3ea6d196fd80749d309e6db8603b235e818cb626a5cea034ff2a55b66e3e1a', 1, 1, 'Personal Access Token', '[]', 1, '2019-08-04 07:14:32', '2019-08-04 07:14:32', '2020-08-04 13:14:32'),
('c25417a5c728073ca8ba57058ded43d496a9d2619b434d2a004dd490a64478c08bc3e06ffc1be65d', 1, 1, 'Personal Access Token', '[]', 1, '2019-07-30 01:45:31', '2019-07-30 01:45:31', '2020-07-30 07:45:31'),
('c40e44743fe58709111cffe5c5c1b800e5c5a20ce1bec99b20a50f5cce3cd7937b1a599b0280b392', 38, 1, 'Personal Access Token', '[]', 1, '2020-11-28 12:46:05', '2020-11-28 12:46:05', '2022-10-29 12:46:05'),
('c7423d85b2b5bdc5027cb283be57fa22f5943cae43f60b0ed27e6dd198e46f25e3501b3081ed0777', 1, 1, 'Personal Access Token', '[]', 1, '2019-08-05 05:02:59', '2019-08-05 05:02:59', '2020-08-05 11:02:59'),
('c8993a612cc6a44d87dc01b14af1b649cbe1209d381af86e88997ad4daac6995c41f7bbf2bc15c45', 23, 1, 'Personal Access Token', '[]', 0, '2020-11-21 16:36:04', '2020-11-21 16:36:04', '2022-10-22 16:36:04'),
('d069929aae365b6a5ebfadfc7a1a1b1906a8a96536dbee9400890fb68abe9efe2ce8853b84becc49', 39, 1, 'Personal Access Token', '[]', 1, '2020-11-28 13:35:23', '2020-11-28 13:35:23', '2022-10-29 13:35:23'),
('d9f4abc0196178f69c401906d8bd0df1c3d8cf9a2e2610dae7fd275b89a13d698361c8b6ad4483a7', 17, 1, 'Personal Access Token', '[]', 1, '2020-11-17 00:42:46', '2020-11-17 00:42:46', '2022-10-18 00:42:46'),
('dc13a2fce7bb0051773d66c1aee8d36404951e22ad594173619984bccf6cf95298f66f707f2eb767', 17, 1, 'Personal Access Token', '[]', 0, '2020-11-16 23:59:42', '2020-11-16 23:59:42', '2022-10-17 23:59:42'),
('dd43494ff827b2eb5505e6eb84e82f80420ffad21f377dcc27e45184946f3960c46b76c6478834a2', 51, 1, 'Personal Access Token', '[]', 0, '2020-12-07 13:23:56', '2020-12-07 13:23:56', '2022-11-07 13:23:56'),
('de201ac9f906031b1b1c0af11a30420a8e5242865bd8184d5545e4567c58419b4b5b4d6bfe07fbd9', 17, 1, 'Personal Access Token', '[]', 0, '2020-11-16 23:44:16', '2020-11-16 23:44:16', '2022-10-17 23:44:16'),
('de4bf462a2ab36c90fd624c07e386704d80623a5ee3b6bfdb731f6031e59ed344922db7d8231a7de', 17, 1, 'Personal Access Token', '[]', 1, '2020-11-28 13:25:52', '2020-11-28 13:25:52', '2022-10-29 13:25:52'),
('e76f19dbd5c2c4060719fb1006ac56116fd86f7838b4bf74e2c0a0ac9696e724df1e517dbdb357f4', 1, 1, 'Personal Access Token', '[]', 1, '2019-07-15 02:53:40', '2019-07-15 02:53:40', '2020-07-15 08:53:40'),
('ed22b23c96c3d255ba9b523cd39bdadc7ae79390f29158b6509cac292d65060ed7abed29ecfeede6', 17, 1, 'Personal Access Token', '[]', 1, '2020-11-16 23:39:17', '2020-11-16 23:39:17', '2022-10-17 23:39:17'),
('ed493f6311fb22401c834cf5d351c71c770124fc5b212f08d9438b90076112a071257c9f7bb29231', 39, 1, 'Personal Access Token', '[]', 1, '2020-11-28 13:28:18', '2020-11-28 13:28:18', '2022-10-29 13:28:18'),
('ed7c269dd6f9a97750a982f62e0de54749be6950e323cdfef892a1ec93f8ddbacf9fe26e6a42180e', 1, 1, 'Personal Access Token', '[]', 1, '2019-07-13 06:36:45', '2019-07-13 06:36:45', '2020-07-13 12:36:45'),
('f03658b552372aa8c8c642153c99c3050907b2779e53563cebff18bcfc8ea772c94749bc3f6494bd', 13, 1, 'Personal Access Token', '[]', 1, '2020-11-17 08:43:13', '2020-11-17 08:43:13', '2022-10-18 08:43:13'),
('f0df7a93178068a57df340ad6f2af39541fbaa1d22dc305dbd2d547687ca74569dd3c16d210231f3', 41, 1, 'Personal Access Token', '[]', 0, '2020-11-28 21:37:31', '2020-11-28 21:37:31', '2022-10-29 21:37:32'),
('f23485d1d30a9ef0a37c9f563d840e8e12eae1efdde63013452a06087d31296a75a71601959a8a3c', 41, 1, 'Personal Access Token', '[]', 0, '2020-12-23 07:25:46', '2020-12-23 07:25:46', '2022-11-23 07:25:46'),
('f5809333e8f23fd5afcbbda37714d9e4171e2612d70e244f4db78d6b16bb7b7eb55aa2a52a858e32', 17, 1, 'Personal Access Token', '[]', 0, '2020-11-17 00:09:10', '2020-11-17 00:09:10', '2021-11-17 00:09:10'),
('f6af95e19e4b71bbe77aef605b3988c7acc500c16292de6c2e05e2c2f7e5dbe06529f1d4e1db939e', 17, 1, 'Personal Access Token', '[]', 1, '2020-11-28 11:58:28', '2020-11-28 11:58:28', '2022-10-29 11:58:28'),
('f6d1475bc17a27e389000d3df4da5c5004ce7610158b0dd414226700c0f6db48914637b4c76e1948', 1, 1, 'Personal Access Token', '[]', 1, '2019-08-04 07:22:01', '2019-08-04 07:22:01', '2020-08-04 13:22:01'),
('f85e4e444fc954430170c41779a4238f84cd6fed905f682795cd4d7b6a291ec5204a10ac0480eb30', 1, 1, 'Personal Access Token', '[]', 1, '2019-07-30 06:38:49', '2019-07-30 06:38:49', '2020-07-30 12:38:49'),
('f8bf983a42c543b99128296e4bc7c2d17a52b5b9ef69670c629b93a653c6a4af27be452e0c331f79', 1, 1, 'Personal Access Token', '[]', 1, '2019-08-04 07:28:55', '2019-08-04 07:28:55', '2020-08-04 13:28:55'),
('fa347c145a5ae322fedc3db38cb0dd871cd8c6fe689c29c0d3757624b500dbe7635c8d4f66b47162', 43, 1, 'Personal Access Token', '[]', 0, '2020-11-29 13:20:49', '2020-11-29 13:20:49', '2022-10-30 13:20:49'),
('fee71af1565a7144ae5220338f2b2bae3485e3064dc5c96e5f1aad66de177055a61213980f14b3ab', 12, 1, 'Personal Access Token', '[]', 0, '2020-11-28 17:27:39', '2020-11-28 17:27:39', '2022-10-29 17:27:39'),
('fef3323b29d35f71f37ac50667dc733fafed92b1433120f1aeed2ccc2a02797d1f18fb79a52efbc9', 17, 1, 'Personal Access Token', '[]', 0, '2020-11-17 00:11:01', '2020-11-17 00:11:01', '2022-10-18 00:11:01');

-- --------------------------------------------------------

--
-- Table structure for table `oauth_auth_codes`
--

CREATE TABLE `oauth_auth_codes` (
  `id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int(11) NOT NULL,
  `client_id` int(10) UNSIGNED NOT NULL,
  `scopes` text COLLATE utf8mb4_unicode_ci,
  `revoked` tinyint(1) NOT NULL,
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `oauth_clients`
--

CREATE TABLE `oauth_clients` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `secret` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `redirect` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `personal_access_client` tinyint(1) NOT NULL,
  `password_client` tinyint(1) NOT NULL,
  `revoked` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `oauth_clients`
--

INSERT INTO `oauth_clients` (`id`, `user_id`, `name`, `secret`, `redirect`, `personal_access_client`, `password_client`, `revoked`, `created_at`, `updated_at`) VALUES
(1, NULL, 'Laravel Personal Access Client', 'eR2y7WUuem28ugHKppFpmss7jPyOHZsMkQwBo1Jj', 'http://localhost', 1, 0, 0, '2019-07-13 06:17:34', '2019-07-13 06:17:34'),
(2, NULL, 'Laravel Password Grant Client', 'WLW2Ol0GozbaXEnx1NtXoweYPuKEbjWdviaUgw77', 'http://localhost', 0, 1, 0, '2019-07-13 06:17:34', '2019-07-13 06:17:34');

-- --------------------------------------------------------

--
-- Table structure for table `oauth_personal_access_clients`
--

CREATE TABLE `oauth_personal_access_clients` (
  `id` int(10) UNSIGNED NOT NULL,
  `client_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `oauth_personal_access_clients`
--

INSERT INTO `oauth_personal_access_clients` (`id`, `client_id`, `created_at`, `updated_at`) VALUES
(1, 1, '2019-07-13 06:17:34', '2019-07-13 06:17:34');

-- --------------------------------------------------------

--
-- Table structure for table `oauth_refresh_tokens`
--

CREATE TABLE `oauth_refresh_tokens` (
  `id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `access_token_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `revoked` tinyint(1) NOT NULL,
  `expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `guest_id` int(11) DEFAULT NULL,
  `shipping_address` longtext COLLATE utf8_unicode_ci,
  `payment_type` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `manual_payment` int(1) NOT NULL DEFAULT '0',
  `manual_payment_data` text COLLATE utf8_unicode_ci,
  `payment_status` varchar(20) COLLATE utf8_unicode_ci DEFAULT 'unpaid',
  `payment_details` longtext COLLATE utf8_unicode_ci,
  `grand_total` double(8,2) DEFAULT NULL,
  `coupon_discount` double(8,2) NOT NULL DEFAULT '0.00',
  `code` mediumtext COLLATE utf8_unicode_ci,
  `date` int(20) NOT NULL,
  `viewed` int(1) NOT NULL DEFAULT '0',
  `delivery_viewed` int(1) NOT NULL DEFAULT '1',
  `payment_status_viewed` int(1) DEFAULT '1',
  `commission_calculated` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `guest_id`, `shipping_address`, `payment_type`, `manual_payment`, `manual_payment_data`, `payment_status`, `payment_details`, `grand_total`, `coupon_discount`, `code`, `date`, `viewed`, `delivery_viewed`, `payment_status_viewed`, `commission_calculated`, `created_at`, `updated_at`) VALUES
(1, 12, NULL, '{\"name\":\"Nishith\",\"email\":\"nhs4learning@gmail.com\",\"address\":\"B 10 Akshardham Bunglow 2, Government Tube Well Road, Bopal\",\"country\":\"India\",\"city\":\"Ambli , Ahmedabad, Ahmedabad\",\"postal_code\":\"380058\",\"phone\":\"7016311514\",\"checkout_type\":\"logged\"}', 'cash_on_delivery', 0, NULL, 'paid', NULL, 145.00, 0.00, '20201112-15540748', 1605176647, 1, 1, 1, 1, '2020-11-12 15:54:07', '2020-11-12 16:03:35'),
(2, 12, NULL, '{\"name\":\"Nishith\",\"email\":\"nhs4learning@gmail.com\",\"address\":\"B 10 Akshardham Bunglow 2, Government Tube Well Road, Bopal\",\"country\":\"India\",\"city\":\"Ambli , Ahmedabad, Ahmedabad\",\"postal_code\":\"380058\",\"phone\":\"7016311514\",\"checkout_type\":\"logged\"}', 'cash_on_delivery', 0, NULL, 'paid', NULL, 1417.50, 0.00, '20201112-17430359', 1605183183, 1, 0, 0, 1, '2020-11-12 17:43:03', '2020-11-18 23:28:57'),
(3, 14, NULL, '{\"name\":\"Atharv Shukla\",\"email\":\"atharvpshukla@gmail.com\",\"address\":\"bhuj\",\"country\":\"India\",\"city\":\"bhuj\",\"postal_code\":\"bhuj\",\"phone\":\"7016210179\",\"checkout_type\":\"logged\"}', 'cash_on_delivery', 0, NULL, 'paid', NULL, 1320.00, 0.00, '20201116-16175388', 1605523673, 1, 0, 0, 1, '2020-11-16 16:17:53', '2020-11-16 17:25:46'),
(4, 13, NULL, '{\"name\":\"Aardra Fashion\",\"email\":\"dristi.shukla@gmail.com\",\"address\":\"266 Umednagar\",\"country\":\"india\",\"city\":\"Bhuj\",\"postal_code\":\"370001\",\"phone\":\"1234567890\",\"checkout_type\":\"logged\"}', 'cod', 0, NULL, 'unpaid', NULL, 1260.00, 0.00, '20201117-094258', 1605586378, 1, 1, 1, 0, '2020-11-17 09:42:58', '2020-11-19 22:32:50'),
(5, 18, NULL, '{\"name\":\"Tapan Sethi\",\"email\":\"sethitapan1@gmail.com\",\"address\":\"11C Dover Terrace\",\"country\":\"India\",\"city\":\"Kolkata\",\"postal_code\":\"700019\",\"phone\":\"9007489801\",\"checkout_type\":\"logged\"}', 'cod', 0, NULL, 'paid', NULL, 95.00, 0.00, '20201117-103756', 1605589676, 1, 0, 0, 1, '2020-11-17 10:37:56', '2020-11-19 22:50:43'),
(6, 11, NULL, '{\"name\":\"Cool wear\",\"email\":\"hirvapshukla@gmail.com\",\"address\":\"bhuj\",\"country\":\"india\",\"city\":\"bhuj\",\"postal_code\":\"370001\",\"phone\":\"7016261550\",\"checkout_type\":\"logged\"}', 'cod', 0, NULL, 'paid', NULL, 1260.00, 0.00, '20201119-103036', 1605805236, 1, 0, 0, 1, '2020-11-19 22:30:36', '2020-11-19 22:33:18'),
(7, NULL, 660251, '{\"name\":\"Atharv Pravarsh Shukla\",\"email\":\"atharvpshukla@gmail.com\",\"address\":\"266 PRAVARSH\",\"country\":\"India\",\"city\":\"kuchchh\",\"postal_code\":\"370001\",\"phone\":\"7016210179\",\"checkout_type\":\"guest\"}', 'cash_on_delivery', 0, NULL, 'paid', NULL, 1499.00, 0.00, '20201121-16373039', 1605956850, 1, 0, 0, 1, '2020-11-21 16:37:30', '2020-11-21 16:38:08'),
(8, 17, NULL, '{\"name\":\"Dib Sarkar\",\"email\":\"sarkardibivd@gmail.com\",\"address\":\"wh\",\"country\":\"hshe\",\"city\":\"jeh\",\"postal_code\":\"71233\",\"phone\":\"hahhshehe\",\"checkout_type\":\"logged\"}', 'cod', 0, NULL, 'unpaid', NULL, 1689.00, 0.00, '20201122-095428', 1606062268, 0, 1, 1, 0, '2020-11-22 21:54:28', '2020-11-22 21:54:28'),
(9, 42, NULL, '{\"name\":\"Dib Sarkar\",\"email\":\"sarkardib052@gmail.com\",\"address\":\"hh h he\",\"country\":\"dhrh\",\"city\":\"when H\",\"postal_code\":\"bfhrh\",\"phone\":\"bbrbt\",\"checkout_type\":\"logged\"}', 'cod', 0, NULL, 'unpaid', NULL, 3868.00, 0.00, '20201129-015116', 1606638076, 0, 1, 1, 0, '2020-11-29 13:51:16', '2020-11-29 13:51:16'),
(10, 42, NULL, '{\"name\":\"Dib Sarkar\",\"email\":\"sarkardib052@gmail.com\",\"address\":\"hh h he\",\"country\":\"dhrh\",\"city\":\"when H\",\"postal_code\":\"bfhrh\",\"phone\":\"bbrbt\",\"checkout_type\":\"logged\"}', 'cod', 0, NULL, 'unpaid', NULL, 3868.00, 0.00, '20201129-015123', 1606638083, 0, 1, 1, 0, '2020-11-29 13:51:23', '2020-11-29 13:51:23'),
(11, 42, NULL, '{\"name\":\"Dib Sarkar\",\"email\":\"sarkardib052@gmail.com\",\"address\":\"nana\",\"country\":\"India\",\"city\":\"Kolkata\",\"postal_code\":\"712233\",\"phone\":\"8240379920\",\"checkout_type\":\"logged\"}', 'cod', 0, NULL, 'unpaid', NULL, 3868.00, 0.00, '20201129-015149', 1606638109, 0, 1, 1, 0, '2020-11-29 13:51:49', '2020-11-29 13:51:49'),
(12, 42, NULL, '{\"name\":\"Dib Sarkar\",\"email\":\"sarkardib052@gmail.com\",\"address\":\"nana\",\"country\":\"India\",\"city\":\"Kolkata\",\"postal_code\":\"712233\",\"phone\":\"8240379920\",\"checkout_type\":\"logged\"}', 'cod', 0, NULL, 'unpaid', NULL, 3868.00, 0.00, '20201129-015201', 1606638121, 0, 1, 1, 0, '2020-11-29 13:52:01', '2020-11-29 13:52:01'),
(13, 42, NULL, '{\"name\":\"Dib Sarkar\",\"email\":\"sarkardib052@gmail.com\",\"address\":\"nana\",\"country\":\"India\",\"city\":\"Kolkata\",\"postal_code\":\"700064\",\"phone\":\"8240379920\",\"checkout_type\":\"logged\"}', 'cod', 0, NULL, 'unpaid', NULL, 3868.00, 0.00, '20201129-015252', 1606638172, 0, 1, 1, 0, '2020-11-29 13:52:52', '2020-11-29 13:52:52'),
(14, 43, NULL, '{\"name\":\"pravarsh shukla\",\"email\":\"pravarsh@gmail.com\",\"address\":\"266\",\"country\":\"india\",\"city\":\"bhuj\",\"postal_code\":\"370001\",\"phone\":\"9879203435\",\"checkout_type\":\"logged\"}', 'cod', 0, NULL, 'paid', NULL, 899.00, 0.00, '20201129-020018', 1606638618, 1, 0, 0, 1, '2020-11-29 14:00:18', '2020-11-29 14:00:51');

-- --------------------------------------------------------

--
-- Table structure for table `order_details`
--

CREATE TABLE `order_details` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `seller_id` int(11) DEFAULT NULL,
  `product_id` int(11) NOT NULL,
  `variation` longtext COLLATE utf8_unicode_ci,
  `price` double(8,2) DEFAULT NULL,
  `tax` double(8,2) NOT NULL DEFAULT '0.00',
  `shipping_cost` double(8,2) NOT NULL DEFAULT '0.00',
  `quantity` int(11) DEFAULT NULL,
  `payment_status` varchar(10) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'unpaid',
  `delivery_status` varchar(20) COLLATE utf8_unicode_ci DEFAULT 'pending',
  `shipping_type` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `pickup_point_id` int(11) DEFAULT NULL,
  `product_referral_code` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `order_details`
--

INSERT INTO `order_details` (`id`, `order_id`, `seller_id`, `product_id`, `variation`, `price`, `tax`, `shipping_cost`, `quantity`, `payment_status`, `delivery_status`, `shipping_type`, `pickup_point_id`, `product_referral_code`, `created_at`, `updated_at`) VALUES
(1, 1, 9, 2, '', 95.00, 0.00, 50.00, 1, 'paid', 'delivered', 'home_delivery', NULL, NULL, '2020-11-12 15:54:07', '2020-11-12 16:01:30'),
(2, 2, 11, 11, '', 1350.00, 67.50, 0.00, 3, 'paid', 'on_delivery', 'home_delivery', NULL, NULL, '2020-11-12 17:43:03', '2020-11-18 23:29:08'),
(3, 3, 13, 12, 'S', 1260.00, 0.00, 60.00, 1, 'paid', 'on_delivery', 'home_delivery', NULL, NULL, '2020-11-16 16:17:53', '2020-11-16 17:25:55'),
(4, 4, 13, 12, 'L', 1260.00, 0.00, 60.00, 1, 'unpaid', 'pending', NULL, NULL, NULL, '2020-11-17 09:42:58', '2020-11-17 09:42:58'),
(5, 5, 9, 2, NULL, 95.00, 0.00, 50.00, 1, 'paid', 'on_delivery', NULL, NULL, NULL, '2020-11-17 10:37:56', '2020-11-19 22:50:43'),
(6, 6, 13, 12, 'S', 1260.00, 0.00, 60.00, 1, 'paid', 'on_delivery', NULL, NULL, NULL, '2020-11-19 22:30:36', '2020-11-19 22:33:18'),
(7, 7, 22, 13, 'Blue-34', 1499.00, 0.00, 0.00, 1, 'paid', 'on_delivery', 'home_delivery', NULL, NULL, '2020-11-21 16:37:30', '2020-11-21 16:38:24'),
(8, 8, 9, 2, NULL, 190.00, 0.00, 50.00, 2, 'unpaid', 'pending', NULL, NULL, NULL, '2020-11-22 21:54:28', '2020-11-22 21:54:28'),
(9, 8, 22, 13, 'Blue-34', 1499.00, 0.00, 0.00, 1, 'unpaid', 'pending', NULL, NULL, NULL, '2020-11-22 21:54:28', '2020-11-22 21:54:28'),
(10, 14, 34, 46, '44', 899.00, 0.00, 0.00, 1, 'paid', 'on_delivery', NULL, NULL, NULL, '2020-11-29 14:00:18', '2020-11-29 14:00:51');

-- --------------------------------------------------------

--
-- Table structure for table `pages`
--

CREATE TABLE `pages` (
  `id` int(11) NOT NULL,
  `title` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `slug` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `content` longtext COLLATE utf8_unicode_ci,
  `meta_title` text COLLATE utf8_unicode_ci,
  `meta_description` varchar(1000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `keywords` varchar(1000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `meta_image` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `email` varchar(191) COLLATE utf8_unicode_ci NOT NULL,
  `token` varchar(191) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `seller_id` int(11) NOT NULL,
  `amount` double(8,2) NOT NULL DEFAULT '0.00',
  `payment_details` longtext COLLATE utf8_unicode_ci,
  `payment_method` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `txn_code` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pickup_points`
--

CREATE TABLE `pickup_points` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `phone` varchar(15) NOT NULL,
  `pick_up_status` int(1) DEFAULT NULL,
  `cash_on_pickup_status` int(1) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `policies`
--

CREATE TABLE `policies` (
  `id` int(11) NOT NULL,
  `name` varchar(35) COLLATE utf8_unicode_ci NOT NULL,
  `content` longtext COLLATE utf8_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `policies`
--

INSERT INTO `policies` (`id`, `name`, `content`, `created_at`, `updated_at`) VALUES
(1, 'support_policy', '<h1>Support Policy</h1><p><br></p><p>All support queries must be sent to support@v4local.in. General SLA is 96 hours. V4local will try to address queries and concerns within 96 hours. All product return/refund will be directly handled by individual seller.<br></p>', '2020-11-16 12:09:12', '2020-11-16 17:39:12'),
(2, 'return_policy', '<h1>Return Policy</h1><p><br></p><p>Kindly check with seller regarding return policy before placing an order. Return is not handled by V4local. Individual seller is responsible for return of products.<br></p>', '2020-11-16 12:07:44', '2020-11-16 17:37:44'),
(4, 'seller_policy', '<h1><strong>Seller\'s Policy</strong></h1><p><br></p><p>V4local is listing service only. V4local is not responsible for listed products and services on its platform. Each seller should mention their refund and return policy. Individual seller is responsibility for product return and refund.<br></p>', '2020-11-16 12:06:36', '2020-11-16 17:36:36');
INSERT INTO `policies` (`id`, `name`, `content`, `created_at`, `updated_at`) VALUES
(5, 'terms', '<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\">\r\n\r\n\r\n    <b><span style=\"font-size:13.5pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Terms of Use</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">V4Local Ecommerce (the “Company”) operates a web/mobile\r\napplication, “V4local” (the “App”) available on Google Play Store and also\r\noperates a website www.V4local.com/ (the “Website”). The App and the Website\r\nshall be together referred to as the “Platform”. These terms and conditions\r\n(“Terms”) govern the use of or access to the Platform and the Services (as\r\ndefined below). These Terms constitute a binding and enforceable legal contract\r\nbetween the Company and a User (as defined below) or any end user of the\r\nServices (collectively, “you”). You represent and warrant that you (a) have\r\nfull legal capacity and authority to agree and bind yourself to these Terms,\r\n(b) are 18 (eighteen) years of age or older. If you represent an entity,\r\norganization, or any other legal person, you confirm and represent that you\r\nhave the necessary power and authority to bind such entity, organization, or\r\nlegal person to these Terms. These Terms also include our privacy policy,\r\navailable at (“Privacy Policy”) and any internal guidelines, supplementary\r\nterms, policies, or disclaimers made available or issued by us from time to\r\ntime. By continuing to access or use the Platform, or any Service on the\r\nPlatform, you signify your acceptance of the Terms. The Company reserves the\r\nright to make changes to these Terms by posting the new/updated version and\r\nyour continued use and/or non-deletion of the Platform shall indicate your\r\nagreement to such changes. Accordingly, we encourage you to kindly continue to\r\nreview the Terms whenever accessing or using the Platform so as to be abreast\r\nwith the changes that we may be carrying out to these Terms. By using the\r\nServices, you agree that you have read, understood, and are bound by these\r\nTerms, and that you comply with the requirements listed herein. If you do not\r\nagree to all of these Terms or comply with the requirements herein, please do\r\nnot access the Platform or use the Services.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<b>Services</b></span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">The Platform (i) provides an online digital store\r\ncreation wherein the users (“Users”), can create their online store by making\r\ncatalog, adding products and share their catalog, product and store to their\r\ncustomers online through social channels and (ii) also allows Users to accept\r\nthe order and take payment via platform. For the purposes of this clause,\r\nServices would include any other future services the Company provides/proposes\r\nto provide.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<b>On-Boarding</b></span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">To avail the\r\nServices, a User would be required to create a profile/sign-up on the Platform\r\n(“Profile”) using his/her email ID and phone number among other details. In\r\naddition to setting up a username and password to create the Profile, the User\r\nwill be required to furnish certain details, including but not limited to phone\r\nnumbers and details of its customers and businesses. The User warrants that all\r\ninformation furnished in connection with its Profile is and shall remain\r\naccurate and true in all respects. The User further agrees and undertakes to\r\npromptly update its details on the Platform in the event of any change or\r\nmodification of such details.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">2.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The User is\r\nsolely responsible for maintaining the security and confidentiality of its\r\nusername and password and agrees to immediately notify the Company in writing\r\nat suppot@V4local.com of any disclosure or unauthorized use of its Profile or\r\nany other breach of security with respect to its Profile.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">3.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The User\r\nexpressly agrees to be liable and accountable for all activities that take\r\nplace through its Profile in furtherance of the use of Service or otherwise.\r\nThe Company expressly excludes any liability for any unauthorized access to a\r\nUser’s Profile.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">4.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The User\r\nagrees to receive communications from the Company regarding: (i) information\r\nrelating to transactions recorded on the Platform; (ii) requests for payment;\r\n(iii) information about the Company and the Services; (iv) promotional offers\r\nand services from the Company and its third-party partners, and (v) any other\r\nmatter in relation to the Services.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Know Your Customer Policy</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The Company\r\nmay require Users to upload certain information and documents that may be necessary\r\nto ascertain their eligibility to use certain features of the Services\r\nincluding but not limited to their identification documents (“KYC Documents”).</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">2.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The User\r\nhereby authorizes the Company and any third-party service provider it may\r\nengage with or interact with in connection with using the Platform to process\r\nKYC Documents and ascertain the User’s eligibility. Any processing undertaken\r\nby the Company shall be in accordance with its Privacy Policy and these Terms.\r\nIt is hereby clarified that as far as the permission of the KYC Documents by a\r\nthird-party service provider is concerned, the same shall be governed by the\r\nprivacy policy of such third-party service provider.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">3.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The User\r\nagrees that it may be required to submit additional documents as and when\r\nrequired by the Company or any of its third party service providers and if, in\r\nsuch an event, any additional information, data, or documentation is required\r\n(collectively, “Top-Up Documents”), the User hereby agrees to share such Top-Up\r\nDocuments promptly upon request, and further, authorizes the Company to process\r\nsuch Top-Up Documents.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">4.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The User\r\nagrees and warrants to provide valid, true, complete, and up-to-date KYC\r\nDocuments and Top-Up Documents. The User further acknowledges that any\r\nincorrect or misleading information provided shall constitute a material breach\r\nof these Terms, and the User’s access to certain features of the Services may\r\nbe limited or denied in such event.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">5.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The list of\r\nthe KYC Documents and Top-Up Documents may be provided to the User at the time\r\nof creating the Profile/signing-up or at a later stage.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Transaction Information</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The Users\r\nmay upload information relating to transactions with their customers or\r\nrelating to their businesses, including the sale of goods or services, costs,\r\namounts paid and payable, and details of goods and services, on the Platform\r\n(such information is referred to as “Transaction Information”). Transaction\r\nInformation may be exchanged between the Users and their customers through\r\ntelephonic calls, text message, WhatsApp, email, or other electronic mediums\r\nthat would depend on the contact details of Users and their customers provided\r\non the Platform.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">2.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">At the time\r\nof creating or uploading the first Transaction Information with respect to\r\ntheir customers, the User shall inform such customers of its use of the\r\nPlatform to record such Transaction Information and Transaction Information\r\nrelated to future transactions and seek such customer’s express consent in this\r\nregard and to:</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">a.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The creation\r\nof a profile of the customer on the Platform, which will require sharing such\r\ncustomer’s phone number and contact details with the Company;</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">b.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Receive\r\ncommunications from the Company regarding: (A) information relating to their\r\ntransactions recorded on the Platform; (B) requests for payment; (C)\r\ninformation about the Company and the Services; (D) promotional offers and\r\nservices from the Company and its third party partners, and (E) any other\r\nmatter in relation to the Services.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">3.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">If such\r\ncustomers fail to provide consent, or withdraw consent, the User shall\r\nimmediately cease to use the Services in relation to such customers.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">4.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The User\r\nshall be solely responsible for obtaining such consent from its customers and\r\nthe Company shall assume that such consent as required under clause 4(b) above\r\nis sought and received by the User if the User provides details of such\r\nTransaction Information relating to any of such customers at any time during\r\nthe use of the Platform.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Third Party Services</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The Services\r\nmay include services, content, documents, and information owned by, licensed\r\nto, or otherwise made available by a third party (“Third Party Services”) or\r\ncontain links to Third Party Services. Users understand that Third Party\r\nServices are the responsibility of the third party that created or provided it\r\nand acknowledge that use of such Third-Party Services is solely at their own\r\nrisk.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">2.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The Company\r\nmakes no representations and hereby expressly excludes all warranties and\r\nliabilities arising out of or pertaining to such Third-Party Services,\r\nincluding their accuracy or completeness. Further, all intellectual property\r\nrights in and to Third Party Services are the property of the respective third\r\nparties.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">3.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The Company\r\nenables payments via payment service providers (“PSP”) partners and the User\r\nshould take care not to share his personal UPI pin or OTP with any third party\r\nintentionally or unintentionally. The Company never solicits information such\r\nas UPI pin or OTP over a call or otherwise. The Company shall not be liable for\r\nany fraud due to the sharing of such details by the User. The providers\r\nproviding Third Party Services / PSP partners shall not be liable for any fraud\r\ndue to sharing of such details by the User. If any of such fraudulent\r\ntransactions occur and where the User shares his debit/credit card or UPI\r\ninformation, the Company may share relevant information of such transaction if\r\nthe victim approaches the Company via proper channels including customer\r\nsupport number and support@V4local.com</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">User Responsibilities</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The User\r\nhereby represents and warrants that all information that is provided by the\r\nUser through or in relation to the Services is valid, complete, true, and\r\ncorrect on the date of agreeing to these Terms and shall continue to be valid,\r\ncomplete, true, and correct throughout the duration of the User’s use of the\r\nPlatform. The Company does not accept any responsibility or liability for any\r\nloss or damage the User may suffer or incur if any information, documentation,\r\nmaterial, or data provided to avail the Services is incorrect, incomplete,\r\ninaccurate, or misleading, or if the User fails to disclose any material fact.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">2.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The User\r\nshall be solely responsible for ensuring compliance with applicable laws and\r\nshall be solely liable for any liability that may arise due to a breach of its\r\nobligations in this regard.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">3.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The User\r\nshall extend all cooperation to the Company in its defending of any proceedings\r\nthat may be initiated against it due to a breach of the User’s obligations or\r\ncovenants under these Terms.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">4.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">While the\r\nCompany uses commercially reasonable efforts to provide Users with a daily\r\nbackup of their Transaction Information, Users should regularly and\r\nindependently save, backup, and archive such Transaction Information.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">5.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The User\r\nshall not use the Services in any manner except as expressly permitted in these\r\nTerms. Without limiting the generality of the preceding sentence, the User may\r\nnot:</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">a.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Infringe\r\neither directly or indirectly any third-party proprietary rights, including but\r\nnot limited to copyrights, patents, trademarks, or trade secrets, of any party;</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">b.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Except as\r\nmay be provided hereunder, use in any manner including copying, displaying, distributing,\r\nmodifying, publishing, reproducing, storing, transmitting, posting,\r\ntranslating, creating any derivative works from, or license the Services;</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">c.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Use the\r\nServices to transmit any data or send or upload any material that contains\r\nviruses, trojan horses or any other harmful programmes or similar computer code\r\ndesigned to adversely affect the operation of any computer software or\r\nhardware;</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">d.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Use any\r\nrobot, spider, other automated device, or manual process to monitor or copy the\r\nPlatform or Services or any portion thereof;</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">e.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Use the\r\nServices in furtherance of / to engage in any activity which may be grossly\r\nharmful, harassing, blasphemous, defamatory, obscene, pornographic, pedophilic,\r\nlibelous, invasive of another\'s privacy, hateful, or racially, ethnically\r\nobjectionable, disparaging, relating or encouraging money laundering or\r\ngambling, or otherwise unlawful in any manner whatever; or unlawfully\r\nthreatening or unlawfully harassing including but not limited to \"indecent\r\nrepresentation of women\" within the meaning of the Indecent Representation\r\nof Women (Prohibition) Act, 1986;</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">f.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\r\n</span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Engage in the systematic retrieval of content from the\r\nPlatform or Services to create or compile, directly or indirectly, a\r\ncollection, compilation, database or directory; or</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">g.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Violate applicable\r\nlaws in any manner.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">6.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Users who\r\nare expected to conduct proper research to ensure that the goods and services\r\nthey send payment links for are in compliance with all applicable laws and we\r\nencourage users to cross-check before generating payment link for prohibited\r\ncontent may result in the suspension or removal of user’s account.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">7.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The User\r\nshall not use the Services for / in furtherance of any sale or supply of\r\nprohibited products or services including but not limited to:</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">a.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Sale of\r\nregulated goods;</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">b.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Sale of\r\ncounterfeit, replicas and pirated goods and goods infringing any intellectual\r\nproperty rights including pirated recordings or copies of unauthorized\r\ncopyrighted materials whether in electronic or physical form or any other\r\nmedium which may not be in existence at present;</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">c.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Sale of\r\ntobacco and cigarettes which includes cigarettes, cigars, chewing tobacco, and\r\nrelated products;</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">d.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Sale of\r\nliquor or any narcotic drugs and psychotropic substances;</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">e.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Sale /\r\nsupply of any good or service which may not be in public interest;</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">f.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\r\n</span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Gambling or other prohibited activities; and</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">g.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Sale /\r\nsupply of good or service which results in non-compliance of any applicable\r\nlaw.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">8.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The User\r\nshall be solely responsible for compliance with all the applicable laws\r\nincluding without limitation the Prevention of Money Laundering Act, 2002 and\r\nthe rules made thereunder. The Company shall not be responsible for any claims\r\nor liability or losses that may arise due to non-compliance of the anti-money\r\nlaundering laws in India.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Intellectual Property</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">All rights,\r\ntitle, and interest in and to the Platform and Services, including all\r\nintellectual property rights arising out of the Platform and Services, are\r\nowned by or otherwise lawfully licensed by the Company. Subject to compliance\r\nwith these Terms, the Company grants the User a non-exclusive,\r\nnon-transferable, non-sub licensable, royalty-free, revocable, and limited\r\nlicence to use the Platform and Services in accordance with these Terms and its\r\nwritten instructions issued from time to time.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">2.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The User\r\nshould assume that everything the User sees or reads on the Platform is\r\nprotected under the Indian Copyright Act, 1957 and other intellectual property\r\nlaws of India and may not be used except with the prior written permission of\r\nthe Company.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">3.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The Company\r\nmay freely use, copy, disclose, publish, display, distribute without any\r\npayment of royalty, acknowledgement, prior consent, or any other form of\r\nrestriction arising out of the User’s intellectual property rights.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">4.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Except as\r\nstated in these Terms, nothing in these Terms should be construed as conferring\r\nany right in or license to the Company’s or any third party’s intellectual\r\nrights.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">5.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The contents\r\nof this Platform, including but not limited to the text and images herein and\r\ntheir arrangements, unless otherwise noted, are copyright-protected in the\r\nwhole and every part of this Platform and the same belongs to the Company and\r\nmay not be used, sold, licensed, copied or reproduced in whole or in part in\r\nany manner or form or in or on any media to any person without the prior\r\nwritten consent of the Company.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Term and Termination</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">These Terms\r\nshall remain in effect unless terminated in accordance with the terms\r\nhereunder.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">2.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The Company\r\nmay terminate a User’s access to or use of the Services, or any portion thereof,\r\nimmediately and at any point, at its sole discretion, if the User violates or\r\nbreaches any of its obligations, responsibilities, or covenants under these\r\nTerms.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">3.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Upon\r\ntermination these Terms shall terminate, except for those clauses that\r\nexpressly or are intended to survive termination or expiry.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">4.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Notwithstanding\r\nanything to the contrary contained in the Terms, upon termination of a User’s\r\naccess to or use of the Services, all amounts or outstanding monies due by you\r\nin relation to your use of or access to the Services shall become immediately\r\npayable.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Disclaimers and Warranties</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The use of\r\nthe Services is at your sole risk.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">2.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">You\r\nacknowledge and agree that the Company is not engaged in the provision, grant,\r\nor disbursement of any financial product. The Company is not and will not be\r\nresponsible for any claim or for any damages suffered, whether by the Users,\r\nthe customers of the Users or any other person or party, that are related,\r\ndirectly or indirectly, to or arise out of the same including any payments made\r\nby the User or by the customers of the User using the payment link generated\r\nusing the Platform. The User further agrees and undertakes to retain proof of\r\nsale documentation (in electronic or physical form) in connection with each\r\npayment link it generates or sends to customers.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">3.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">To the\r\nextent permitted by applicable law, the Services are provided on an “as is” and\r\n“as available” basis. The Company does not warrant that operation of the\r\nServices will be uninterrupted or error free or that the functions contained in\r\nthe Services will meet your requirements.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">4.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">To the\r\nfullest extent permissible under applicable law, the Company expressly\r\ndisclaims all warranties of any kind, express or implied, arising out of the\r\nServices, including warranties of merchantability, fitness for a particular\r\npurpose, satisfactory quality, accuracy, title and non-infringement,\r\ncompatibility, applicability, usability, appropriateness, and any warranty that\r\nmay arise out of course of performance, course of dealing, or usage of trade.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">5.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">You hereby\r\naccept full responsibility for any consequences that may arise from your use of\r\nthe Services, and expressly agree and acknowledge that the Company shall have\r\nabsolutely no liability with respect to the same.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">6.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">To the\r\nfullest extent permissible by law, the Company, its affiliates, and its related\r\nparties each disclaim all liability to you for any loss or damage arising out\r\nof or due to:</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">a.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Your use of,\r\ninability to use, or availability or unavailability of the Services, including\r\nany Third-Party Services;</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">b.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The\r\noccurrence or existence of any defect, interruption, or delays in the operation\r\nor transmission of information to, from, or through the Services,\r\ncommunications failure, theft, destruction or unauthorized access to the\r\nCompany’s records, programmes, services, server, or other infrastructure\r\nrelating to the Services; or</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">c.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The failure\r\nof the Services to remain operational for any period of time.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">7.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Notwithstanding\r\nanything to the contrary contained herein, neither the Company nor any of its\r\naffiliates or related parties shall have any liability to you or any third\r\nparty for any indirect, incidental, special or consequential damages or any\r\nloss of revenue or profits arising under, directly or indirectly, or relating,\r\nin any manner whatsoever, to these Terms or the Services. To the maximum extent\r\npermitted by law, you agree to waive, release, discharge, and hold harmless the\r\nCompany, its affiliated and subsidiary companies, its parent companies, and\r\neach of their directors, officers, employees, and agents, from any and all\r\nclaims, losses, damages, liabilities, expenses and causes of action arising out\r\nof the Services.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">8.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">V4local\r\ncurrently is not a payment aggregator or payment gateway-it is enabling\r\npayments for its users via third-party payments service providers. Any charges\r\nlevied by V4local for usage are service charges. In case you need an invoice\r\nfor the charges levied please email to support@V4local.com</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Indemnity</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">You shall indemnify, defend at the Company’s option, and\r\nhold the Company, its parent companies, subsidiaries, affiliates, and their\r\nofficers, associates successors, assigns, licensors, employees, directors,\r\nagents, and representatives, harmless from and against any claim, demand,\r\nlawsuits, judicial proceeding, losses, liabilities, damages and costs\r\n(including, without limitation, from all damages, liabilities, settlements,\r\ncosts and attorneys’ fees) due to or arising out of your access to the\r\nServices, use of the Services, violation of these Terms or any infringement by\r\nany third party who may use your account with the Company, of these Terms.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<b>Consent to Use Data</b></span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">You agree\r\nthat the Company and any third-party service providers it engages, may, in\r\naccordance with its Privacy Policy, collect and use your information and\r\ntechnical data and related information.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">2.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The Company\r\nmay use information and data pertaining to your use of the Services for\r\nanalytics, trends’ identification, and purposes of statistics to further\r\nenhance the effectiveness and efficiency of the Platform.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">3.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Subject to\r\napplicable laws, the Company may be directed by law enforcement agencies or the\r\ngovernment and related bodies to disclose data in relation to Users in connection\r\nwith criminal proceedings. You understand and agree that in such instances, the\r\nCompany shall have the right to share such data with relevant agencies or\r\nbodies.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Maintenance of Records</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">You shall maintain the records of all payment\r\ntransactions on the Platform independently of the Platform (by way physical\r\ncopies et cetera) and the Company reserves the right to seek copies of such\r\nrecords for their own use including record keeping.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<b>Fees/Charges</b></span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">The Company reserves the right to charge a convenience\r\nfee for the Services and non-payment may result in denial of Services.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<b>Modification</b></span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">The Company reserves the right at any time to add, modify\r\nor discontinue, temporarily or permanently, the Services (or any part thereof)\r\nwith or without cause. The Company shall not be liable for any such addition,\r\nmodification, suspension or discontinuation of the Services.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<b>Jurisdiction, Governing Laws and Dispute Resolution</b></span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">These Terms shall be governed by and construed and\r\nenforced in accordance with the laws of India. Subject to other provisions in\r\nthis Clause, courts in Bhuj shall have exclusive jurisdiction over all issues\r\narising out of these Terms or the use of the Services. Any controversies,\r\nconflicts, disputes, or differences arising out of these Terms shall be resolved\r\nby arbitration in Bhuj in accordance with the Arbitration and Conciliation Act,\r\n1996 for the time being in force, which is deemed to be incorporated by\r\nreference in this Clause. The tribunal shall consist of 1 (one) arbitrator\r\nappointed by the Company. The language of the arbitration shall be English. The\r\nparties to the arbitration shall keep the arbitration confidential and not\r\ndisclose to any person, other than on a need to basis or to legal advisors,\r\nunless required to do so by law. The decision of the arbitrator shall be final\r\nand binding on all the Parties hereto. Each party to the arbitration shall bear\r\nits own costs with respect to any dispute.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<b>Miscellaneous Provisions</b></span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Modification\r\n– The Company reserves the right at any time to modify these Terms and to add\r\nnew or additional terms or conditions on use of the Services. Such\r\nmodifications and additional terms and conditions will be communicated to you\r\nand, unless expressly rejected (in which these Terms shall terminate), will be\r\neffective immediately and will be incorporated into these Terms. In the event\r\nyou refuse to accept such changes, these Terms will terminate.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">2.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Severability\r\n- If any provision of these Terms is determined by any court or other competent\r\nauthority to be unlawful or unenforceable, the other provisions of these Terms\r\nwill continue in effect. If any unlawful or unenforceable provision would be\r\nlawful or enforceable if part of it were deleted, that part will be deemed to\r\nbe deleted, and the rest of the provision will continue in effect (unless that\r\nwould contradict the clear intention of the clause, in which case the entirety\r\nof the relevant provision will be deemed to be deleted).</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">3.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Assignment -\r\nYou shall not license, sell, transfer or assign your rights, obligations, or\r\ncovenants under these Terms in any manner without the Company’s prior written\r\nconsent. The Company may grant or withhold this consent in its sole discretion\r\nand subject to any conditions it deems appropriate. The Company may assign its\r\nrights to any of its affiliates, subsidiaries, or parent companies, or to any\r\nsuccessor in interest of any business associated with the Services without any\r\nprior notice to you.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">4.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Notices -\r\nAll notices, requests, demands, and determinations for the Company under these\r\nTerms (other than routine operational communications) shall be sent to support@V4local.com</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">5.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Third Party\r\nRights - No third party shall have any rights to enforce any terms contained\r\nherein.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">6.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Translations\r\n–The Company may provide you with translated versions of these Terms solely to\r\nassist you with understanding these Terms in greater detail. The English\r\nversion of these Terms shall be controlling in all respects. In the event of\r\nany inconsistency between the English version of these Terms and any translated\r\nversion, the terms of the English version shall prevail.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Refund/Cancellation</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Cancellation</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">UPI\r\nTransactions cannot be cancelled after initiating the transaction. If the User\r\nhas entered the wrong number/VPA ID, then the Company is not a liable party in\r\nthe transaction.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">2.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">All UPI\r\ntransactions are real-time and if there is any delay in the end of the\r\ntransaction then the User can check with support team of V4local at support@V4local.com\r\nafter 30 mins cool period.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Debit/Credit Card<br>\r\nIf the User has any issues related to transactions linked with Debit/Credit\r\ncard, then the User must report the same to the Company’s mail support@V4local.com</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The Company\r\nwill respond and try to resolve the issue in the given escalation matrix as per\r\nthe Company’s internal processes and policies.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">2.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">All refunds\r\nwill be processed by following the validation of the transaction from case to\r\ncase basis in the given legal framework.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">3.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Escalation\r\nmatrix remains the same for the Refunds/Cancellation for all the transactions.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\">&nbsp;</p><br>', '2020-11-11 14:59:18', '2020-11-11 20:29:18');
INSERT INTO `policies` (`id`, `name`, `content`, `created_at`, `updated_at`) VALUES
(6, 'privacy_policy', '<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\">\r\n\r\n\r\n    <b><span style=\"font-size:13.5pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Privacy Policy</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Effective date:&nbsp;</span></b><span style=\"font-size:\r\n12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:&quot;Times New Roman&quot;;\r\nmso-fareast-language:EN-IN;mso-bidi-language:GU\">November 15, 2020</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<br>\r\nWelcome to V4LOCAL. V4Local Ecommerce (\"us\", \"we\", or\r\n\"our\") operates the V4LOCAL website and the V4LOCAL mobile\r\napplication (hereinafter referred to as the \"Service\"). This page\r\ninforms you of our policies regarding the collection, use and disclosure of\r\npersonal data when you use our Service and the choices you have associated with\r\nthat data. We use your data to provide and improve the Service. By using the\r\nService, you agree to the collection and use of information in accordance with\r\nthis policy. Unless otherwise defined in this Privacy Policy, the terms used in\r\nthis Privacy Policy have the same meanings as in our Terms and Conditions.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<b>Definitions</b></span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Service</span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><br>\r\nService means the V4LOCAL website and the V4LOCAL mobile application operated\r\nby V4Local Ecommerce</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">2.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Personal Data</span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><br>\r\nPersonal Data means data about a living individual who can be identified from\r\nthose data (or from those and other information either in our possession or\r\nlikely to come into our possession).</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">3.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Usage Data</span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><br>\r\nUsage Data is data collected automatically either generated by the use of the\r\nService or from the Service infrastructure itself (for example, the duration of\r\na page visit).</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">4.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Cookies</span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><br>\r\nCookies are small files stored on your device (computer or mobile device).</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">5.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Data Controller</span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><br>\r\nData Controller means the natural or legal person who (either alone or jointly\r\nor in common with other persons) determines the purposes for which and the\r\nmanner in which any personal information are, or are to be, processed. For the\r\npurpose of this Privacy Policy, we are a Data Controller of your Personal Data.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">6.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Data\r\nProcessors (or Service Providers)</span></b><span style=\"font-size:12.0pt;\r\nfont-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:&quot;Times New Roman&quot;;\r\nmso-fareast-language:EN-IN;mso-bidi-language:GU\"><br>\r\nData Processor (or Service Provider) means any natural or legal person who\r\nprocesses the data on behalf of the Data Controller. We may use the services of\r\nvarious Service Providers in order to process your data more effectively.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">7.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Data Subject\r\n(or User)</span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\nData Subject is any living individual who is using our Service and is the\r\nsubject of Personal Data.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Information Collection and Use</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">We collect several different types of information for\r\nvarious purposes to provide and improve our Service to you.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<b>Types of Data Collected</b></span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Personal\r\nData</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;\r\nfont-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:&quot;Times New Roman&quot;;\r\nmso-fareast-language:EN-IN;mso-bidi-language:GU\">While using our Service, we\r\nmay ask you to provide us with certain personally identifiable information that\r\ncan be used to contact or identify you (\"Personal Data\"). Personally,\r\nidentifiable information may include, but is not limited to:</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">a.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Email\r\naddress</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">b.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">First name\r\nand last name</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">c.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Phone number</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">d.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Address,\r\nState, Province, ZIP/Postal code, City</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">e.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Cookies and\r\nUsage Data</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;\r\nfont-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:&quot;Times New Roman&quot;;\r\nmso-fareast-language:EN-IN;mso-bidi-language:GU\">We may use your Personal Data\r\nto contact you with newsletters, marketing or promotional materials and other\r\ninformation that may be of interest to you. You may opt out of receiving any,\r\nor all, of these communications from us by following the unsubscribe link or\r\nthe instructions provided in any email we send.<br>\r\n<br style=\"mso-special-character:line-break\">\r\n<br style=\"mso-special-character:line-break\">\r\n</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">2.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Usage Data</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;\r\nfont-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:&quot;Times New Roman&quot;;\r\nmso-fareast-language:EN-IN;mso-bidi-language:GU\">We may also collect\r\ninformation that your browser sends whenever you visit our Service or when you\r\naccess the Service by or through a mobile device (\"Usage Data\"). This\r\nUsage Data may include information such as your computer\'s Internet Protocol\r\naddress (e.g. IP address), browser type, browser version, the pages of our\r\nService that you visit, the time and date of your visit, the time spent on\r\nthose pages, unique device identifiers and other diagnostic data. When you\r\naccess the Service with a mobile device, this Usage Data may include\r\ninformation such as the type of mobile device you use, your mobile device\r\nunique ID, the IP address of your mobile device, your mobile operating system,\r\nthe type of mobile Internet browser you use, unique device identifiers and\r\nother diagnostic data.<br>\r\n<br style=\"mso-special-character:line-break\">\r\n<br style=\"mso-special-character:line-break\">\r\n</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">3.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Location\r\nData</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;\r\nfont-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:&quot;Times New Roman&quot;;\r\nmso-fareast-language:EN-IN;mso-bidi-language:GU\">We may use and store\r\ninformation about your location if you give us permission to do so\r\n(\"Location Data\"). We use this data to provide features of our\r\nService, to improve and customise our Service. You can enable or disable\r\nlocation services when you use our Service at any time by way of your device\r\nsettings.<br>\r\n<br style=\"mso-special-character:line-break\">\r\n<br style=\"mso-special-character:line-break\">\r\n</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">4.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Tracking\r\n&amp; Cookies Data</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;\r\nfont-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:&quot;Times New Roman&quot;;\r\nmso-fareast-language:EN-IN;mso-bidi-language:GU\">We use cookies and similar\r\ntracking technologies to track the activity on our Service and we hold certain\r\ninformation. Cookies are files with a small amount of data which may include an\r\nanonymous unique identifier. Cookies are sent to your browser from a website\r\nand stored on your device. Other tracking technologies are also used such as\r\nbeacons, tags and scripts to collect and track information and to improve and\r\nanalyse our Service. You can instruct your browser to refuse all cookies or to\r\nindicate when a cookie is being sent. However, if you do not accept cookies,\r\nyou may not be able to use some portions of our Service. Examples of Cookies we\r\nuse:</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">a.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Session\r\nCookies</span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">&nbsp;- We use Session Cookies to operate our Service.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">b.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Preference\r\nCookies</span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">&nbsp;- We use Preference Cookies to remember your\r\npreferences and various settings.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">c.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Security\r\nCookies</span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">&nbsp;- We use Security Cookies for security purposes.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Use of Data</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">V4Local Ecommerce uses the collected data for various\r\npurposes:</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">To provide\r\nand maintain our Service</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">2.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">To notify\r\nyou about changes to our Service</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">3.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">To allow you\r\nto participate in interactive features of our Service when you choose to do so</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">4.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">To provide\r\ncustomer support</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">5.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">To gather\r\nanalysis or valuable information so that we can improve our Service</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">6.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">To monitor\r\nthe usage of our Service</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">7.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">To detect,\r\nprevent and address technical issues</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">8.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">To provide\r\nyou with news, special offers and general information about other goods,\r\nservices and events which we offer that are similar to those that you have\r\nalready purchased or enquired about unless you have opted not to receive such\r\ninformation</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Legal Basis for Processing Personal Data under the\r\nGeneral Data Protection Regulation (GDPR)</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">V4Local Ecommerce may process your Personal Data because:</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">We need to\r\nperform a contract with you</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">2.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">You have\r\ngiven us permission to do so</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">3.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The\r\nprocessing is in our legitimate interests and it is not overridden by your\r\nrights</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">4.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">For payment\r\nprocessing purposes</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">5.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">To comply\r\nwith the law</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Retention of Data</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">V4Local Ecommerce will retain your Personal Data only for\r\nas long as is necessary for the purposes set out in this Privacy Policy. We\r\nwill retain and use your Personal Data to the extent necessary to comply with\r\nour legal obligations (for example, if we are required to retain your data to\r\ncomply with applicable laws), resolve disputes and enforce our legal agreements\r\nand policies. V4Local Ecommerce will also retain Usage Data for internal\r\nanalysis purposes. Usage Data is generally retained for a shorter period of\r\ntime, except when this data is used to strengthen the security or to improve\r\nthe functionality of our Service, or we are legally obligated to retain this\r\ndata for longer periods.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<b>Transfer of Data</b></span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Your information, including Personal Data, may be\r\ntransferred to — and maintained on — computers located outside of your state,\r\nprovince, country or other governmental jurisdiction where the data protection\r\nlaws may differ from those of your jurisdiction. If you are located outside\r\nIndia and choose to provide information to us, please note that we transfer the\r\ndata, including Personal Data, to India and process it there. Your consent to\r\nthis Privacy Policy followed by your submission of such information represents\r\nyour agreement to that transfer. V4Local Ecommerce will take all the steps\r\nreasonably necessary to ensure that your data is treated securely and in\r\naccordance with this Privacy Policy and no transfer of your Personal Data will\r\ntake place to an organisation or a country unless there are adequate controls\r\nin place including the security of your data and other personal information.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<b>Disclosure of Data</b>&nbsp;<b>Business Transaction</b></span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">If V4Local Ecommerce is involved in a merger, acquisition\r\nor asset sale, your Personal Data may be transferred. We will provide notice\r\nbefore your Personal Data is transferred and becomes subject to a different\r\nPrivacy Policy.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<b>Disclosure for Law Enforcement</b></span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Under certain circumstances, V4Local Ecommerce may be\r\nrequired to disclose your Personal Data if required to do so by law or in\r\nresponse to valid requests by public authorities (e.g. a court or a government\r\nagency).</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<b>Legal Requirements</b></span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">V4Local Ecommerce may disclose your Personal Data in the\r\ngood faith belief that such action is necessary to:</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">To comply\r\nwith a legal obligation</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">2.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">To protect\r\nand defend the rights or property of V4Local Ecommerce</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">3.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">To prevent\r\nor investigate possible wrongdoing in connection with the Service</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">4.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">To protect\r\nthe personal safety of users of the Service or the public</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">5.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">To protect\r\nagainst legal liability</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Security of Data</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">The security of your data is important to us but remember\r\nthat no method of transmission over the Internet or method of electronic\r\nstorage is 100% secure. While we strive to use commercially acceptable means to\r\nprotect your Personal Data, we cannot guarantee its absolute security.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<b>Your Data Protection Rights under the General Data Protection Regulation\r\n(GDPR)</b></span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">If you are a resident of the European Economic Area\r\n(EEA), you have certain data protection rights. V4Local Ecommerce aims to take\r\nreasonable steps to allow you to correct, amend, delete or limit the use of\r\nyour Personal Data. If you wish to be informed about what Personal Data, we\r\nhold about you and if you want it to be removed from our systems, please\r\ncontact us. In certain circumstances, you have the following data protection\r\nrights:</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">a.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The right to\r\naccess, update or delete the information we have on you. </span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Whenever\r\nmade possible, you can access, update or request deletion of your Personal Data\r\ndirectly within your account settings section. If you are unable to perform\r\nthese actions yourself, please contact us to assist you.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">b.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The right of\r\nrectification. </span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">You have the right to have your information rectified if\r\nthat information is inaccurate or incomplete.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">c.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The right to\r\nobject. </span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">You have the right to object to our processing of your\r\nPersonal Data.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">d.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The right of\r\nrestriction.&nbsp;</span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">You have the right to request that we restrict the processing\r\nof your personal information.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">e.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">The right to\r\ndata portability. </span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">You have the right to be provided with a copy of the\r\ninformation we have on you in a structured, machine-readable and commonly used\r\nformat.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">f.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\r\n</span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:\r\n&quot;Arial&quot;,sans-serif;mso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:\r\nEN-IN;mso-bidi-language:GU\">The right to withdraw consent. </span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">You also\r\nhave the right to withdraw your consent at any time where V4Local Ecommerce\r\nrelied on your consent to process your personal information.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Please note that we may ask you to verify your identity\r\nbefore responding to such requests. You have the right to complain to a Data\r\nProtection Authority about our collection and use of your Personal Data. For\r\nmore information, please contact your local data protection authority in the\r\nEuropean Economic Area (EEA).</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<b>Service Providers</b></span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">We may employ third party companies and individuals to\r\nfacilitate our Service (\"Service Providers\"), provide the Service on\r\nour behalf, perform Service-related services or assist us in analysing how our\r\nService is used. These third parties have access to your Personal Data only to\r\nperform these tasks on our behalf and are obligated not to disclose or use it\r\nfor any other purpose.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<b>Analytics</b></span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">We may use third-party Service Providers to monitor and\r\nanalyse the use of our Service.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Google\r\nAnalytics</span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\nGoogle Analytics is a web analytics service offered by Google that tracks and\r\nreports website traffic. Google uses the data collected to track and monitor\r\nthe use of our Service. This data is shared with other Google services. Google\r\nmay use the collected data to contextualise and personalise the ads of its own\r\nadvertising network. For more information on the privacy practices of Google,\r\nplease visit the Google Privacy &amp; Terms web page:&nbsp;</span><a href=\"https://policies.google.com/privacy?hl=en\" target=\"_blank\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;color:#7162BF;mso-fareast-language:EN-IN;mso-bidi-language:\r\nGU\">https://policies.google.com/privacy?hl=en</span></a></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">2.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Firebase</span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><br>\r\nFirebase is an analytics service provided by Google Inc. You may opt-out of\r\ncertain Firebase features through your mobile device settings, such as your\r\ndevice advertising settings or by following the instructions provided by Google\r\nin their Privacy Policy:&nbsp;</span><a href=\"https://policies.google.com/privacy?hl=en\" target=\"_blank\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;color:#7162BF;mso-fareast-language:EN-IN;mso-bidi-language:\r\nGU\">https://policies.google.com/privacy?hl=en</span></a><span style=\"font-size:\r\n12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:&quot;Times New Roman&quot;;\r\nmso-fareast-language:EN-IN;mso-bidi-language:GU\">&nbsp;We also encourage you to\r\nreview the Google\'s policy for safeguarding your data:&nbsp;</span><a href=\"https://support.google.com/analytics/answer/6004245\" target=\"_blank\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;color:#7162BF;mso-fareast-language:EN-IN;mso-bidi-language:\r\nGU\">https://support.google.com/analytics/answer/6004245</span></a><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">&nbsp;. For\r\nmore information on what type of information Firebase collects, please visit\r\nthe Google Privacy &amp; Terms web page:&nbsp;</span><a href=\"https://policies.google.com/privacy?hl=en\" target=\"_blank\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;color:#7162BF;mso-fareast-language:EN-IN;mso-bidi-language:\r\nGU\">https://policies.google.com/privacy?hl=en</span></a></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Behavioural Remarketing</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">V4Local Ecommerce uses remarketing services to advertise\r\non third party websites to you after you visited our Service. We and our\r\nthird-party vendors use cookies to inform, optimise and serve ads based on your\r\npast visits to our Service.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Google Ads\r\n(AdWords)</span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\nGoogle Ads (AdWords) remarketing service is provided by Google Inc. You can\r\nopt-out of Google Analytics for Display Advertising and customise the Google\r\nDisplay Network ads by visiting the Google Ads Settings page:&nbsp;</span><a href=\"http://www.google.com/settings/ads\" target=\"_blank\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;color:#7162BF;mso-fareast-language:EN-IN;mso-bidi-language:\r\nGU\">http://www.google.com/settings/ads</span></a><span style=\"font-size:12.0pt;\r\nfont-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:&quot;Times New Roman&quot;;\r\nmso-fareast-language:EN-IN;mso-bidi-language:GU\">&nbsp;Google also recommends\r\ninstalling the Google Analytics Opt-out Browser Add-on -&nbsp;</span><a href=\"https://tools.google.com/dlpage/gaoptout\" target=\"_blank\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;color:#7162BF;mso-fareast-language:EN-IN;mso-bidi-language:\r\nGU\">https://tools.google.com/dlpage/gaoptout</span></a><span style=\"font-size:\r\n12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:&quot;Times New Roman&quot;;\r\nmso-fareast-language:EN-IN;mso-bidi-language:GU\">&nbsp;- for your web browser.\r\nGoogle Analytics Opt-out Browser Add-on provides visitors with the ability to\r\nprevent their data from being collected and used by Google Analytics. For more\r\ninformation on the privacy practices of Google, please visit the Google Privacy\r\n&amp; Terms web page:&nbsp;</span><a href=\"https://policies.google.com/privacy?hl=en\" target=\"_blank\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;color:#7162BF;mso-fareast-language:EN-IN;mso-bidi-language:\r\nGU\">https://policies.google.com/privacy?hl=en</span></a></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Behavioural Remarketing</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">V4Local Ecommerce uses remarketing services to advertise\r\non third party websites to you after you visited our Service. We and our\r\nthird-party vendors use cookies to inform, optimise and serve ads based on your\r\npast visits to our Service.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Google Ads\r\n(AdWords)</span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\nGoogle Ads (AdWords) remarketing service is provided by Google Inc. You can\r\nopt-out of Google Analytics for Display Advertising and customise the Google\r\nDisplay Network ads by visiting the Google Ads Settings page:&nbsp;</span><a href=\"http://www.google.com/settings/ads\" target=\"_blank\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;color:#7162BF;mso-fareast-language:EN-IN;mso-bidi-language:\r\nGU\">http://www.google.com/settings/ads</span></a><span style=\"font-size:12.0pt;\r\nfont-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:&quot;Times New Roman&quot;;\r\nmso-fareast-language:EN-IN;mso-bidi-language:GU\">&nbsp;Google also recommends\r\ninstalling the Google Analytics Opt-out Browser Add-on -&nbsp;</span><a href=\"https://tools.google.com/dlpage/gaoptout\" target=\"_blank\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;color:#7162BF;mso-fareast-language:EN-IN;mso-bidi-language:\r\nGU\">https://tools.google.com/dlpage/gaoptout</span></a><span style=\"font-size:\r\n12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:&quot;Times New Roman&quot;;\r\nmso-fareast-language:EN-IN;mso-bidi-language:GU\">&nbsp;- for your web browser.\r\nGoogle Analytics Opt-out Browser Add-on provides visitors with the ability to\r\nprevent their data from being collected and used by Google Analytics. For more\r\ninformation on the privacy practices of Google, please visit the Google Privacy\r\n&amp; Terms web page:&nbsp;</span><a href=\"https://policies.google.com/privacy?hl=en\" target=\"_blank\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;color:#7162BF;mso-fareast-language:EN-IN;mso-bidi-language:\r\nGU\">https://policies.google.com/privacy?hl=en</span></a></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">2.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Facebook</span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><br>\r\nFacebook remarketing service is provided by Facebook Inc. You can learn more\r\nabout interest-based advertising from Facebook by visiting this page:&nbsp;</span><a href=\"https://www.facebook.com/help/164968693837950\" target=\"_blank\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;color:#7162BF;mso-fareast-language:EN-IN;mso-bidi-language:\r\nGU\">https://www.facebook.com/help/164968693837950</span></a><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">&nbsp;To\r\nopt-out from Facebook\'s interest-based ads, follow these instructions from\r\nFacebook:&nbsp;</span><a href=\"https://www.facebook.com/help/568137493302217\" target=\"_blank\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;color:#7162BF;mso-fareast-language:\r\nEN-IN;mso-bidi-language:GU\">https://www.facebook.com/help/568137493302217</span></a><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">&nbsp;Facebook\r\nadheres to the Self-Regulatory Principles for Online Behavioural Advertising\r\nestablished by the Digital Advertising Alliance. You can also opt-out from Facebook\r\nand other participating companies through the Digital Advertising Alliance in\r\nthe USA&nbsp;</span><a href=\"http://www.aboutads.info/choices/\" target=\"_blank\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;color:#7162BF;mso-fareast-language:EN-IN;mso-bidi-language:\r\nGU\">http://www.aboutads.info/choices/</span></a><span style=\"font-size:12.0pt;\r\nfont-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:&quot;Times New Roman&quot;;\r\nmso-fareast-language:EN-IN;mso-bidi-language:GU\">&nbsp;the Digital Advertising\r\nAlliance of Canada in Canada&nbsp;</span><a href=\"http://youradchoices.ca/\" target=\"_blank\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;color:#7162BF;mso-fareast-language:\r\nEN-IN;mso-bidi-language:GU\">http://youradchoices.ca/</span></a><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">&nbsp;or the\r\nEuropean Interactive Digital Advertising Alliance in Europe&nbsp;</span><a href=\"http://www.youronlinechoices.eu/\" target=\"_blank\"><span style=\"font-size:\r\n12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:&quot;Times New Roman&quot;;\r\ncolor:#7162BF;mso-fareast-language:EN-IN;mso-bidi-language:GU\">http://www.youronlinechoices.eu/</span></a><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">&nbsp;or\r\nopt-out using your mobile device settings. For more information on the privacy\r\npractices of Facebook, please visit Facebook\'s Data Policy:&nbsp;</span><a href=\"https://www.facebook.com/privacy/explanation\" target=\"_blank\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;color:#7162BF;mso-fareast-language:EN-IN;mso-bidi-language:\r\nGU\">https://www.facebook.com/privacy/explanation</span></a></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">SMS/App Notifications</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">We will be sending the user of V4Local App and V4Local.com\r\norder status, offer notification based on their interaction with our service.\r\nWe will be notifying seller about new order received or change in order status\r\nvia app notification, we will be also sending order confirmation to consumer\r\nthru SMS, also send order status based on their transaction with V4Local.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<b>Payments</b></span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">We may provide paid products and/or services within the\r\nService. In that case, we use third-party services for payment processing (e.g.\r\npayment processors). We will not store or collect your payment card details.\r\nThat information is provided directly to our third-party payment processors\r\nwhose use of your personal information is governed by their Privacy Policy.\r\nThese payment processors adhere to the standards set by PCI-DSS as managed by\r\nthe PCI Security Standards Council, which is a joint effort of brands like\r\nVisa, MasterCard, American Express and Discover. PCI-DSS requirements help\r\nensure the secure handling of payment information. The payment processors we\r\nwork with are:</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\nArial;mso-fareast-language:EN-IN;mso-bidi-language:GU\"><span style=\"mso-list:\r\nIgnore\">1.<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp; </span></span>\r\n    </span><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;mso-bidi-language:GU\">Google Play\r\nIn-App Payments</span></b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\nTheir Privacy Policy can be viewed at&nbsp;</span><a href=\"https://www.google.com/policies/privacy/\" target=\"_blank\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;mso-fareast-font-family:\r\n&quot;Times New Roman&quot;;color:#7162BF;mso-fareast-language:EN-IN;mso-bidi-language:\r\nGU\">https://www.google.com/policies/privacy/</span></a></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><b><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Links to Other Sites</span></b></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Our Service may contain links to other sites that are not\r\noperated by us. If you click a third-party link, you will be directed to that\r\nthird party\'s site. We strongly advise you to review the Privacy Policy of\r\nevery site you visit. We have no control over and assume no responsibility for\r\nthe content, privacy policies or practices of any third-party sites or\r\nservices.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<b>Children\'s Privacy</b></span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">Our Service does not address anyone under the age of 18\r\n(\"Children\"). We do not knowingly collect personally identifiable\r\ninformation from anyone under the age of 18. If you are a parent or guardian\r\nand you are aware that your Child has provided us with Personal Data, please\r\ncontact us. If we become aware that we have collected Personal Data from\r\nchildren without verification of parental consent, we take steps to remove that\r\ninformation from our servers.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<b>Changes to This Privacy Policy</b></span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">We may update our Privacy Policy from time to time. We\r\nwill notify you of any changes by posting the new Privacy Policy on this page.\r\nWe will let you know via email and/or a prominent notice on our Service, prior\r\nto the change becoming effective and update the \"effective date\" at\r\nthe top of this Privacy Policy. You are advised to review this Privacy Policy\r\nperiodically for any changes. Changes to this Privacy Policy are effective when\r\nthey are posted on this page.</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\"><br>\r\n<b>Contact Us</b></span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">If you have any questions about this Privacy Policy,\r\nplease contact us:</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:10.0pt;mso-bidi-font-size:12.0pt;font-family:Symbol;\r\nmso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-fareast-language:\r\nEN-IN;mso-bidi-language:GU\"><span style=\"mso-list:Ignore\">·<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\r\n</span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">By email: support@v4local.com</span></p>\r\n\r\n<p class=\"MsoNormal\" style=\"text-indent: -18pt; margin: 0cm 0cm 8pt; line-height: 107%; font-size: 11pt; font-family: Calibri, sans-serif;\"><span style=\"font-size:10.0pt;mso-bidi-font-size:12.0pt;font-family:Symbol;\r\nmso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol;mso-fareast-language:\r\nEN-IN;mso-bidi-language:GU\"><span style=\"mso-list:Ignore\">·<span style=\"font:7.0pt &quot;Times New Roman&quot;\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\r\n</span></span>\r\n    </span><span style=\"font-size:12.0pt;font-family:&quot;Arial&quot;,sans-serif;\r\nmso-fareast-font-family:&quot;Times New Roman&quot;;mso-fareast-language:EN-IN;\r\nmso-bidi-language:GU\">By visiting this page on our website:&nbsp;https://v4local.in/privacypolicy</span></p><br>', '2020-11-11 14:58:43', '2020-11-11 20:28:43');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(200) COLLATE utf8_unicode_ci NOT NULL,
  `added_by` varchar(6) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'admin',
  `user_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `subcategory_id` int(11) NOT NULL,
  `subsubcategory_id` int(11) DEFAULT NULL,
  `brand_id` int(11) DEFAULT NULL,
  `photos` varchar(2000) COLLATE utf8_unicode_ci DEFAULT NULL,
  `thumbnail_img` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `video_provider` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `video_link` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `tags` mediumtext COLLATE utf8_unicode_ci,
  `description` longtext COLLATE utf8_unicode_ci,
  `unit_price` double(8,2) NOT NULL,
  `purchase_price` double(8,2) NOT NULL,
  `variant_product` int(1) NOT NULL DEFAULT '0',
  `attributes` varchar(1000) COLLATE utf8_unicode_ci NOT NULL DEFAULT '[]',
  `choice_options` mediumtext COLLATE utf8_unicode_ci,
  `colors` mediumtext COLLATE utf8_unicode_ci,
  `variations` text COLLATE utf8_unicode_ci,
  `todays_deal` int(11) NOT NULL DEFAULT '0',
  `published` int(11) NOT NULL DEFAULT '1',
  `featured` int(11) NOT NULL DEFAULT '0',
  `current_stock` int(10) NOT NULL DEFAULT '0',
  `unit` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `min_qty` int(11) NOT NULL DEFAULT '1',
  `discount` double(8,2) DEFAULT NULL,
  `discount_type` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL,
  `tax` double(8,2) DEFAULT NULL,
  `tax_type` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL,
  `shipping_type` varchar(20) CHARACTER SET latin1 DEFAULT 'flat_rate',
  `shipping_cost` double(8,2) DEFAULT '0.00',
  `num_of_sale` int(11) NOT NULL DEFAULT '0',
  `meta_title` mediumtext COLLATE utf8_unicode_ci,
  `meta_description` longtext COLLATE utf8_unicode_ci,
  `meta_img` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `pdf` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `slug` mediumtext COLLATE utf8_unicode_ci NOT NULL,
  `rating` double(8,2) NOT NULL DEFAULT '0.00',
  `barcode` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `digital` int(1) NOT NULL DEFAULT '0',
  `file_name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `file_path` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `added_by`, `user_id`, `category_id`, `subcategory_id`, `subsubcategory_id`, `brand_id`, `photos`, `thumbnail_img`, `video_provider`, `video_link`, `tags`, `description`, `unit_price`, `purchase_price`, `variant_product`, `attributes`, `choice_options`, `colors`, `variations`, `todays_deal`, `published`, `featured`, `current_stock`, `unit`, `min_qty`, `discount`, `discount_type`, `tax`, `tax_type`, `shipping_type`, `shipping_cost`, `num_of_sale`, `meta_title`, `meta_description`, `meta_img`, `pdf`, `slug`, `rating`, `barcode`, `digital`, `file_name`, `file_path`, `created_at`, `updated_at`) VALUES
(1, 'Dabur Lal Tail 500ml – Ayurvedic Baby Oil 500 ml', 'admin', 9, 4, 10, NULL, NULL, '[\"uploads\\/products\\/photos\\/Q7udd6OlmBHUweSybWpjp3PRdTxDlox0Jj424ALk.jpeg\"]', 'uploads/products/thumbnail/lYUU44BqFH71jxf8zcO05XErzJI2ow4oEQgqCIgp.jpeg', 'youtube', NULL, '', '<p><br></p>Baby Oil', 550.00, 890.00, 0, '[]', '[]', '[]', '[]', 0, 0, 0, 10, 'pc', 1, 0.00, 'percent', 0.00, 'amount', 'free', 0.00, 0, 'Baby Oil', 'Baby Oil', 'uploads/products/meta/AOSmmvzwvThHedArBlpK3bmveAULmsyGcmxi3q1A.jpeg', NULL, 'Dabur-Lal-Tail-500ml--Ayurvedic-Baby-Oil-500-ml-S6Hjh', 0.00, NULL, 0, NULL, NULL, '2020-11-07 23:36:17', '2020-11-24 14:31:59'),
(2, 'Lifestyle Modular Kitchens Stainless steel V Shape Cup Stand Pieces Medium (Color: silver ,12 Cups Stand)', 'admin', 9, 3, 7, 19, NULL, '[\"uploads\\/products\\/photos\\/Gg0ufV1uuOzaKuMJhEvaiIXCFRjBV7uQUGF625ou.jpeg\"]', 'uploads/products/thumbnail/9YZRlcPh88EUKd2vfgr8jptnIhV9k85wUiKdSmqZ.jpeg', 'youtube', NULL, '', '<p><span style=\"color: rgb(17, 17, 17); font-family: verdana, arial, helvetica, sans-serif; font-size: 17px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: left; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-style: initial; text-decoration-color: initial; display: inline !important; float: none;\">Lifestyle Modular Kitchens Stainless steel V Shape Cup Stand Pieces Medium (Color: silver ,12 Cups Stand)</span><br></p>Western Wear Gown.', 100.00, 120.00, 0, '[]', '[]', '[]', '[]', 0, 0, 0, 7, 'pc', 1, 5.00, 'percent', 0.00, 'amount', 'flat_rate', 50.00, 4, 'cup-stand', 'cup-stand', 'uploads/products/meta/AmlT6TZbtGEP6FqMKt9Aap8HsfkOWgCGkES8EH54.jpeg', NULL, 'Lifestyle-Modular-Kitchens-Stainless-steel-V-Shape-Cup-Stand-Pieces-Medium-Color-silver-12-Cups-Stand-Md4yR', 0.00, NULL, 0, NULL, NULL, '2020-11-07 23:36:17', '2020-11-24 14:32:23'),
(3, 'Sportneer Cycling Shorts 3D Padded Bicycle Bike Shorts Underwear with Anti-Slip Leg Grips and Sweat Resistant Properties', 'admin', 9, 5, 12, 30, NULL, '[\"uploads\\/products\\/photos\\/Z3x87rEv6InOwFsEw6wEcc54ATBur84WHrhvVuYc.jpeg\",\"uploads\\/products\\/photos\\/UEYyoksFdJtHxWnPo8lGWMexzrIjJ90PbC5f68nH.jpeg\"]', 'uploads/products/thumbnail/ViDaH2K89iysDGzTMYxJlejxj4d19pie87MjzB9W.jpeg', 'youtube', NULL, '', '<ul class=\"a-unordered-list a-vertical a-spacing-mini\" style=\"line-height: normal; box-sizing: border-box; text-decoration: none; outline: 0px; margin: 0px 0px 0px 18px; padding: 0px; border: 0px; font-size: 14px; background: rgb(255, 255, 255); list-style: none; color: rgb(17, 17, 17); font-family: &quot;Amazon Ember&quot;, Arial, sans-serif; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px;\"><li style=\"line-height: normal; box-sizing: border-box; text-decoration: none; outline: 0px; margin: 0px; padding: 0px; border: 0px; font-size: 14px; background: transparent; list-style: disc; overflow-wrap: break-word;\"><span class=\"a-list-item\" style=\"line-height: normal; box-sizing: border-box; text-decoration: none; outline: 0px; margin: 0px; padding: 0px; border: 0px; font-size: 14px; background: transparent; list-style: none; color: rgb(17, 17, 17);\">ANTI-SLIP LEG GRIPS: Pedal with pro-like swiftness; the leg grip firmly keep the shorts in place, with smoothness that prevents abrasions and chafing</span></li><li style=\"line-height: normal; box-sizing: border-box; text-decoration: none; outline: 0px; margin: 0px; padding: 0px; border: 0px; font-size: 14px; background: transparent; list-style: disc; overflow-wrap: break-word;\"><span class=\"a-list-item\" style=\"line-height: normal; box-sizing: border-box; text-decoration: none; outline: 0px; margin: 0px; padding: 0px; border: 0px; font-size: 14px; background: transparent; list-style: none; color: rgb(17, 17, 17);\">COMFORTABLE FOR LONG DISTANCES: These padded bike shorts allow you to cycle the distance without experiencing chafing and saddle sores, for absolute cloud-like comfort</span></li><li style=\"line-height: normal; box-sizing: border-box; text-decoration: none; outline: 0px; margin: 0px; padding: 0px; border: 0px; font-size: 14px; background: transparent; list-style: disc; overflow-wrap: break-word;\"><span class=\"a-list-item\" style=\"line-height: normal; box-sizing: border-box; text-decoration: none; outline: 0px; margin: 0px; padding: 0px; border: 0px; font-size: 14px; background: transparent; list-style: none; color: rgb(17, 17, 17);\">3D PADDING: The breathable pad features quality stitching that won’t be subjected to wear-and-tear, and provides cushioning even while cycling for long distances</span></li><li style=\"line-height: normal; box-sizing: border-box; text-decoration: none; outline: 0px; margin: 0px; padding: 0px; border: 0px; font-size: 14px; background: transparent; list-style: disc; overflow-wrap: break-word;\"><span class=\"a-list-item\" style=\"line-height: normal; box-sizing: border-box; text-decoration: none; outline: 0px; margin: 0px; padding: 0px; border: 0px; font-size: 14px; background: transparent; list-style: none; color: rgb(17, 17, 17);\">BREATHABLE &amp; LIGHTWEIGHT: Designed with 90% polyester and 10% spandex, these bike shorts are flexible, tear-resistant with breathability for an enjoyable ride ahead</span></li><li style=\"line-height: normal; box-sizing: border-box; text-decoration: none; outline: 0px; margin: 0px; padding: 0px; border: 0px; font-size: 14px; background: transparent; list-style: disc; overflow-wrap: break-word;\"><span class=\"a-list-item\" style=\"line-height: normal; box-sizing: border-box; text-decoration: none; outline: 0px; margin: 0px; padding: 0px; border: 0px; font-size: 14px; background: transparent; list-style: none; color: rgb(17, 17, 17);\">SWEAT RESISTANT: The quick-dry material disperses sweat away from the shorts, for a smooth, dry ride.</span></li></ul><br>', 120.00, 160.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"M\",\"L\",\"XL\",\"XXL\"]}]', '[]', '[]', 0, 0, 0, 12, 'pc', 1, 0.00, 'amount', 0.00, 'percent', 'flat_rate', 0.00, 0, 'Cycling Shorts', 'Cycling Shorts', 'uploads/products/meta/nCFq3ojy7JXdl669PggFvwNRW2rZZSXU3oF8hK7o.jpeg', NULL, 'Sportneer-Cycling-Shorts-3D-Padded-Bicycle-Bike-Shorts-Underwear-with-Anti-Slip-Leg-Grips-and-Sweat-Resistant-Properties-kBFy0', 0.00, NULL, 0, NULL, NULL, '2020-11-07 23:36:17', '2020-11-24 14:32:27'),
(6, 'Winter wear', 'admin', 9, 1, 1, NULL, NULL, '[\"uploads\\/products\\/photos\\/WkkUKgQ5nfuFfvG6aclPxogU4qj8ypOGAq86iElV.jpeg\"]', 'uploads/products/thumbnail/g0G4HemuPEpf1zme3pIWgl5WG3zBd5RuMm2DW18Z.jpeg', 'youtube', 'https://www.youtube.com/watch?v=SPt4j8Fn5D8', '', '<ul class=\"a-unordered-list a-vertical a-spacing-mini\" style=\"line-height: normal; box-sizing: border-box; text-decoration: none; outline: 0px; margin: 0px 0px 0px 18px; padding: 0px; border: 0px; font-size: 14px; background: rgb(255, 255, 255); list-style: none; color: rgb(17, 17, 17); font-family: &quot;Amazon Ember&quot;, Arial, sans-serif; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px;\"><li style=\"line-height: normal; box-sizing: border-box; text-decoration: none; outline: 0px; margin: 0px; padding: 0px; border: 0px; font-size: 14px; background: transparent; list-style: disc; overflow-wrap: break-word;\"><span class=\"a-list-item\" style=\"line-height: normal; box-sizing: border-box; text-decoration: none; outline: 0px; margin: 0px; padding: 0px; border: 0px; font-size: 14px; background: transparent; list-style: none; color: rgb(17, 17, 17); overflow-wrap: break-word; display: block;\">Fabric: 100% Wool</span></li><li style=\"line-height: normal; box-sizing: border-box; text-decoration: none; outline: 0px; margin: 0px; padding: 0px; border: 0px; font-size: 14px; background: transparent; list-style: disc; overflow-wrap: break-word;\"><span class=\"a-list-item\" style=\"line-height: normal; box-sizing: border-box; text-decoration: none; outline: 0px; margin: 0px; padding: 0px; border: 0px; font-size: 14px; background: transparent; list-style: none; color: rgb(17, 17, 17); overflow-wrap: break-word; display: block;\">Sleeve: Long Sleeve</span></li><li style=\"line-height: normal; box-sizing: border-box; text-decoration: none; outline: 0px; margin: 0px; padding: 0px; border: 0px; font-size: 14px; background: transparent; list-style: disc; overflow-wrap: break-word;\"><span class=\"a-list-item\" style=\"line-height: normal; box-sizing: border-box; text-decoration: none; outline: 0px; margin: 0px; padding: 0px; border: 0px; font-size: 14px; background: transparent; list-style: none; color: rgb(17, 17, 17); overflow-wrap: break-word; display: block;\">Neck Style: V-Neck</span></li><li style=\"line-height: normal; box-sizing: border-box; text-decoration: none; outline: 0px; margin: 0px; padding: 0px; border: 0px; font-size: 14px; background: transparent; list-style: disc; overflow-wrap: break-word;\"><span class=\"a-list-item\" style=\"line-height: normal; box-sizing: border-box; text-decoration: none; outline: 0px; margin: 0px; padding: 0px; border: 0px; font-size: 14px; background: transparent; list-style: none; color: rgb(17, 17, 17); overflow-wrap: break-word; display: block;\">Closure: Button</span></li></ul><br>', 100.00, 70.00, 1, '[]', '[]', '[\"#9966CC\",\"#00FFFF\",\"#00FFFF\"]', '[]', 0, 0, 0, 10, 'pc', 1, 10.00, 'percent', 0.00, 'amount', 'free', 0.00, 0, 'Winter wear', 'Fabric: 100% Wool\r\nSleeve: Long Sleeve\r\nNeck Style: V-Neck\r\nClosure: Button', 'uploads/products/meta/2F5PbHo6SZYP7ys4kCTCLyC9gXGLcVLe4jqkqHR3.jpeg', NULL, 'Winter-wear-TynIf', 0.00, NULL, 0, NULL, NULL, '2020-11-12 00:07:16', '2020-11-24 14:32:15'),
(11, 'MacV Wayfarer Sunglasses for Men & Women 100% UV protected Lenses & Polycarbonate Material.', 'seller', 11, 2, 5, 15, NULL, '[\"uploads\\/products\\/photos\\/YewnSd5jNG8Y9nv2M7Ju2eMuayw7akzqvWw5P0h8.jpeg\"]', 'uploads/products/thumbnail/yAJS4rlzj5gARyYLjYrkSgEoKWxgZ65i2bINoakW.jpeg', 'youtube', NULL, 'wayfare', 'Sunglasses', 500.00, 800.00, 0, '[]', '[]', '[]', NULL, 0, 0, 0, 97, 'pc', 1, 10.00, 'percent', 5.00, 'percent', 'flat_rate', 60.00, 1, 'wayfare', 'Sunglasses', 'uploads/products/meta/aTZd3DUIZeDgz6kTjvPVxdI6q4FSjWLsis7oKTp6.jpeg', NULL, 'MacV-Wayfarer-Sunglasses-for-Men--Women-100-UV-protected-Lenses--Polycarbonate-Material-2tQP6', 0.00, NULL, 0, NULL, NULL, '2020-11-12 17:28:38', '2020-11-23 16:01:02'),
(13, 'Slim Fit Jeans', 'seller', 22, 2, 4, 11, 3, '[\"uploads\\/products\\/photos\\/mRS7KxR8IWLPAcNSxOOAMQnMJjzOEJY6ferPfU5S.jpeg\"]', 'uploads/products/thumbnail/ogZ7Zo7HZkBtIBdvZkrO6kRoDnLbtwbv5jKgWsjh.jpeg', 'youtube', NULL, 'Uspolo-jeans', '<p>US POLO Mens Slim Fit Jeans</p><p>Original Brand at Reduced Price</p><p>Available in different sizes and colors<br></p>', 3100.00, 1650.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"34\",\"36\",\"38\"]}]', '[\"#0000FF\",\"#00008B\",\"#A9A9A9\"]', NULL, 0, 1, 1, 0, 'Pc', 1, 0.00, 'percent', 0.00, 'amount', 'free', 0.00, 2, 'Uspolo-jeans', 'Slim Fit Jeans', 'uploads/products/meta/EwEVBiSEA9IImEKl38rFQw1L3ZfAPvPGsXDFGC6e.jpeg', NULL, 'Slim-Fit-Jeans-yWB7e', 0.00, NULL, 0, NULL, NULL, '2020-11-21 16:33:00', '2020-11-22 21:54:28'),
(14, 'T Shirt', 'seller', 26, 2, 4, NULL, 3, '[\"uploads\\/products\\/photos\\/Tl1NM45HeN05D8IvwgwTOJfLDfjRwo6ZKZByvYQM.jpeg\"]', NULL, 'youtube', NULL, 'Us Polo', NULL, 700.00, 350.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 3, '10', 1, 50.00, 'percent', 0.00, 'amount', 'free', 0.00, 0, 'T Shirt', 'UsPolo men\'s T shirt', NULL, NULL, 'T-Shirt-Dccky', 0.00, NULL, 0, NULL, NULL, '2020-11-23 11:43:39', '2020-11-23 11:44:59'),
(15, 'Track Pant', 'seller', 26, 2, 4, NULL, NULL, '[\"uploads\\/products\\/photos\\/wSU1AfIcifoiA7Qb3edlj6cuw9Oe96wy0Kx4Pfbz.jpeg\"]', NULL, 'youtube', NULL, 'Men\'s dry fit track pent', '<h3>Track Pants for Men.</h3>', 799.00, 799.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"M\",\"L\",\"XL\"]}]', '[\"#E0FFFF\",\"#D3D3D3\"]', NULL, 0, 1, 0, 0, '3', 1, 10.00, 'percent', 0.00, 'amount', 'free', 0.00, 0, 'Men\'s track Pants', 'Men\'s dry fit track Pants m to xl', NULL, NULL, 'Track-Pant-wynpD', 0.00, NULL, 0, NULL, NULL, '2020-11-23 11:57:04', '2020-11-23 17:17:27'),
(16, 'Rayon Slub Handwork Pant Set', 'seller', 24, 1, 1, 1, 7, '[\"uploads\\/products\\/photos\\/9E9YJXL8NIFpBkCYdORnLGNnG3Fbn4bYtX3trUat.jpeg\",\"uploads\\/products\\/photos\\/ndHeU88Rgg4lBEiCQnadjnf1xPzIN3dE1QaARGZY.jpeg\",\"uploads\\/products\\/photos\\/fptchqbDC3Kc4Eoz0jQ95adkCR1Aoy2xtL5aeTw1.jpeg\",\"uploads\\/products\\/photos\\/nvuX8MowXcRUnI6RNEqNCclPzoX9Y9Dj97u0y4U7.jpeg\",\"uploads\\/products\\/photos\\/opN2NhV0YpusY3J8I9dcb0n4E4Z9qz0v2K02lrRi.jpeg\",\"uploads\\/products\\/photos\\/WvjoxA3fSAZyFSEqO71mJ07KjNhN4MCGfFFXZs1k.jpeg\",\"uploads\\/products\\/photos\\/J1S6QPqio15FswyES8vmuu60jIYgTpQJn2JJ8Cvq.jpeg\",\"uploads\\/products\\/photos\\/W5Nq7btr0smDZ7WZ0ZzjgJu6mT76PGiB8JKfiwzr.jpeg\",\"uploads\\/products\\/photos\\/c5zFSceTIAGtL3Od6H2lf6cGx1KPTkPrIgT7HXuo.jpeg\"]', 'uploads/products/thumbnail/joisHWlMVJzU6ZYP6NinqqX5PYU7g4laeYJHu0HL.jpeg', 'youtube', NULL, 'Rayon - Pant - set', '<p>Rayon</p><p>Pant Set</p><p>Handwork</p><p><br></p>', 835.00, 835.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"M\",\"L\",\"XL\",\"XXL\"]}]', '[\"#000000\",\"#A52A2A\",\"#8B0000\",\"#808080\",\"#F5FFFA\",\"#FFC0CB\"]', NULL, 1, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Rayon Pant Set', 'Pant Set\r\nHandwork\r\nRayon', 'uploads/products/meta/a5xvhacJJirDE6vGYX0WGczKx0OLNBVsrNmy2W5P.jpeg', NULL, 'Rayon-Slub-Handwork-Pant-Set-CTH3r', 0.00, NULL, 0, NULL, NULL, '2020-11-23 15:40:46', '2020-11-23 16:00:51'),
(17, 'Reebook Sports Zipper', 'seller', 26, 2, 4, 34, NULL, '[\"uploads\\/products\\/photos\\/r4uDb6RvAif5AzizYuh9Ei7IcB1er8xswiSXVya1.jpeg\",\"uploads\\/products\\/photos\\/9jgPIizZjRAjnzqisiUMyuh5ts0OCfqn1X45NTvE.jpeg\"]', 'uploads/products/thumbnail/vTEeXO02CuQZzx8Hu6bvrwdaANZyhsJkriUJ5Evs.jpeg', 'youtube', NULL, 'Reebok-zipper', 'Reebok sports jacket', 1200.00, 1200.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"M\",\"L\",\"XL\"]}]', '[\"#A9A9A9\"]', NULL, 0, 1, 0, 0, 'pc', 1, 0.00, 'percent', 0.00, 'amount', 'free', 0.00, 0, 'Reebok zipper', 'Reebok sportswear jacket.', 'uploads/products/meta/YSYNKOIXi7avdeUFJ3jr5XuararmVyBwgtp1ExV6.jpeg', NULL, 'Reebook-Sports-Zipper-6FxBL', 0.00, NULL, 0, NULL, NULL, '2020-11-23 17:16:46', '2020-11-23 17:16:46'),
(18, 'T shirt', 'seller', 26, 2, 4, 34, NULL, '[\"uploads\\/products\\/photos\\/7Cv6v9hxSiX0hg0cT9a38uVtjKvFQ0ovYTR0pYF6.jpeg\"]', 'uploads/products/thumbnail/xDrFAJMgHgzBdgab6GVX83LkOLjB2baCUsTVhXMZ.jpeg', 'youtube', NULL, 'Undar Armor', '<h1>T shirt undar Armor 4 way Lycra</h1>', 699.00, 699.00, 1, '[]', '[]', '[\"#00008B\"]', NULL, 0, 1, 0, 0, '4 way Lycra t shirt', 1, 10.00, 'percent', 0.00, 'amount', 'free', 0.00, 0, 'Undar Armor t shirt', 'Undar Armor 4way Lycra', 'uploads/products/thumbnail/xDrFAJMgHgzBdgab6GVX83LkOLjB2baCUsTVhXMZ.jpeg', NULL, 'T-shirt-J6MKL', 0.00, NULL, 0, NULL, NULL, '2020-11-23 17:38:09', '2020-11-23 17:38:09'),
(19, 'Puma zipper', 'seller', 26, 2, 4, 34, NULL, '[\"uploads\\/products\\/photos\\/94bwqgA52tjwakkNnKac5SJZVux3fNFwC5nrPrpT.jpeg\"]', 'uploads/products/thumbnail/rMOZi1cva7fyhn4WrbLUHx9gaLaBtpJDRVcNYxvB.jpeg', 'youtube', NULL, 'Puma ns Zipper', '<h3>mens Puma Zipper<br></h3>', 1400.00, 1400.00, 0, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"L XL\"]}]', '[\"#FF0000\"]', NULL, 0, 1, 0, 0, 'Ns Lycra', 1, 10.00, 'percent', 0.00, 'amount', 'free', 0.00, 0, 'Puma jackets', 'Puma jackets ns Lycra with inner', 'uploads/products/thumbnail/rMOZi1cva7fyhn4WrbLUHx9gaLaBtpJDRVcNYxvB.jpeg', NULL, 'Puma-zipper-j5lUd', 0.00, NULL, 0, NULL, NULL, '2020-11-24 19:00:49', '2020-11-24 19:00:49'),
(20, 'Paradise', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/YU6JIc0Rln1eT6iVNyoJ0Xph8zgYpkXNznhRr6e6.jpeg\"]', 'uploads/products/thumbnail/HvDw4yAtiYNp5vH9mmPd6k6fESmRZYE7VGvJeu2V.jpeg', 'youtube', NULL, 'Kurti', 'Fabrics :- Chanderi , Rayon ,Cotton Mal With Embroidery Work With Crop Top Strug, Sharara, Pant With Dupatta', 1599.00, 1599.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"44\"]}]', '[]', NULL, 0, 1, 0, 1, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Chanderi Kurti', 'Fabrics :- Chanderi , Rayon ,Cotton Mal With Embroidery Work With Crop Top Strug, Sharara, Pant With Dupatta', 'uploads/products/meta/tHsI6gS1NGL3o3hnSWbc8OadYqGak5jZxcTAZBM6.jpeg', NULL, 'Paradise-xOviQ', 0.00, NULL, 0, NULL, NULL, '2020-11-27 00:51:14', '2020-11-29 13:57:30'),
(21, 'Black Kurti', 'seller', 34, 1, 1, 35, NULL, '[\"uploads\\/products\\/photos\\/mfjgW91Jze7MXlGnFZzOOD3eKnLRI7fS4979xnw0.jpeg\",\"uploads\\/products\\/photos\\/AR7sPjyckZytMcKrlbWRqWPa3sBCTHcQDFXXYJxl.jpeg\",\"uploads\\/products\\/photos\\/jqCiQRxXkcbWNOR7hPigDKrenQCgMOOpNrgfKtmm.jpeg\",\"uploads\\/products\\/photos\\/ZLZCozRMqjtR2iMf0QhAFTaS6krTg8aySmC6hDxW.jpeg\",\"uploads\\/products\\/photos\\/VTLSGutREHOD2AQLXS3a3FtZtPRfCoEsML1zp9Eb.jpeg\",\"uploads\\/products\\/photos\\/nO3oGfQdqBMC6VqxSLbHARXJW2iHeyLYngzAKPwA.jpeg\"]', 'uploads/products/thumbnail/uePajyi58Zsje5BvamM23vT4Yo8BoghlEaX4GOPZ.jpeg', 'youtube', NULL, 'Rayon', 'Presents An Beautifully Gold Printed Black Frock Style Kurti Paired With Black Solid Dhoti Style Pant. This Is The Fine And Latest Design Exclusively Made For Black Trendy Color Lovers. This Set\'S Trendy And Work Speaks All About It. The Kurti Has Waist Belt As Dori Tessel That Makes It More Interesting, Has Yoke Placket With Buttons , Has Good Festive Flared At Bottom, Has Chinese Collar , And Styleesh Sleeves With Shimmer At Sleevse And Collar, Also Gota Lace Work On Bottom Of The Kurti And Dhoti Layer.', 996.00, 996.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"46\"]}]', '[]', NULL, 0, 1, 0, 1, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Presents An Beautifully Gold Printed Black Frock Style Kurti Paired With Black Solid Dhoti Style Pant. This Is The Fine And Latest Design Exclusively Made For Black Trendy Color Lovers. This Set\'S Trendy And Work Speaks All About It. The Kurti Has Waist Belt As Dori Tessel That Makes It More Interesting, Has Yoke Placket With Buttons , Has Good Festive Flared At Bottom, Has Chinese Collar , And Styleesh Sleeves With Shimmer At Sleevse And Collar, Also Gota Lace Work On Bottom Of The Kurti And Dhoti Layer.', 'uploads/products/meta/1CrMJAtxkcobJVlwaIinDiFDNDyqTTHGnOPLn1TG.jpeg', NULL, 'Black-Kurti-0qy93', 0.00, NULL, 0, NULL, NULL, '2020-11-27 00:57:03', '2020-11-29 13:57:08'),
(22, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/RcfFDWttZTXA97Dv3re9J85MTlwMnIgzNiwDK2Nc.jpeg\",\"uploads\\/products\\/photos\\/5nmP0r21SGNIwQX71j01xnZdT0AyTJsOmZhYhTPo.jpeg\",\"uploads\\/products\\/photos\\/dcn8MfgPTR5e5JHQNe6tq2BaF5t3TE1GdqUgvYjb.jpeg\",\"uploads\\/products\\/photos\\/PdxNIBd5kQkG8vqAgKnj9VCfPmyIdc3dWv1FHOhD.jpeg\"]', 'uploads/products/thumbnail/uT9WIkEBmu0uq9T4BP8rAnR72F5SD6QMx6mF88IH.jpeg', 'youtube', NULL, 'Rayon', 'Interlocking-Same Thread, Side Slit Protection Stitching, Color Will Not Bleed, Will Not Shrink.', 799.00, 799.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"38\"]}]', '[]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Interlocking-Same Thread, Side Slit Protection Stitching, Color Will Not Bleed, Will Not Shrink.', 'uploads/products/meta/ZmtfojT66BnLMthciBATzG27MZ4e0FC6k3zJ42zF.jpeg', NULL, 'Kurti-4bVwR', 0.00, NULL, 0, NULL, NULL, '2020-11-27 01:04:22', '2020-11-29 13:56:41'),
(23, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/nmGx4XcrLo4e7xKwinh1KgDrCdrIM5tkcyWreSsM.jpeg\",\"uploads\\/products\\/photos\\/rccPHXTcFT9tzCTHYv5FuEy4ffBLoj8GAlgLssMG.jpeg\"]', 'uploads/products/thumbnail/561WkIhtAlVwg8KNjP6WXiFACA6N3JWBX8Pw6iXd.jpeg', 'youtube', NULL, 'Cotton,Block Printed', 'Light Green Cotton Yarn Dyed Slub Inner Block Printed With Green Yarn Dyed Katha Stripe Jacket Dress, Interlocking-Same Thread, Side Slit Protection Stitching', 1250.00, 1250.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"38\",\"40\",\"42\",\"44\"]}]', '[]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Light Green Cotton Yarn Dyed Slub Inner Block Printed With Green Yarn Dyed Katha Stripe Jacket Dress, Interlocking-Same Thread, Side Slit Protection Stitching', 'uploads/products/meta/8FelGrKN0QPAHKr8znYH4uKEb5m4fRh71Cdg9mgD.jpeg', NULL, 'Kurti-pPijT', 0.00, NULL, 0, NULL, NULL, '2020-11-27 01:06:47', '2020-11-29 13:56:19'),
(24, 'Kurti', 'seller', 34, 1, 1, 35, NULL, '[\"uploads\\/products\\/photos\\/120H16dAF9X8unatG4X6f4odlS4SHhZe1xYYOlar.jpeg\",\"uploads\\/products\\/photos\\/RaFm3Ayj4NMhwI6CbmUP8EVqBicE7v2bjOe4fnc3.jpeg\",\"uploads\\/products\\/photos\\/x8ugsNQx8wzsVbuLcOPLq42BnXPD66CHWgVOfqGg.jpeg\"]', 'uploads/products/thumbnail/4MgIlNaInkE6RAGYzk8FLvt24j59kLyMCGq8NuOX.jpeg', 'youtube', NULL, 'Rayon', 'Interlocking Stitching With Bottom Double Fold Stitching', 999.00, 999.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"44\"]}]', '[]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Interlocking Stitching With Bottom Double Fold Stitching', 'uploads/products/meta/Um6aIrUh5G4y4ap0atMJprJI2n8hnQQzbE9NEpJY.jpeg', NULL, 'Kurti-Avsg3', 0.00, NULL, 0, NULL, NULL, '2020-11-27 01:10:08', '2020-11-29 13:55:57'),
(25, 'Kurti', 'seller', 34, 1, 1, 35, NULL, '[\"uploads\\/products\\/photos\\/9Kzf4cXafIQn8Az698GTIfYoRUtioLL6rQpG4OFt.jpeg\",\"uploads\\/products\\/photos\\/zTIN2XjVZviHUOI1Sciuff2r6JWxMBKHbulljl9U.jpeg\",\"uploads\\/products\\/photos\\/PgPOkHyKnHJILdYE2MIlCdbuyJcvw68oY6FWnIvn.jpeg\"]', 'uploads/products/thumbnail/f7nOCmWvcW2lZ7lrfv1c26ZP63YVMFxUqjOEeEp1.jpeg', 'youtube', NULL, 'Hand Work', 'Interlocking Stitching With Bottom Double Fold Stitching', 999.00, 999.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"44\"]}]', '[]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Interlocking Stitching With Bottom Double Fold Stitching', 'uploads/products/meta/PnjP5Sau4rf7xpzMk9i3xZJFQ7nYsvTBGtoP4fGS.jpeg', NULL, 'Kurti-Y7pjm', 0.00, NULL, 0, NULL, NULL, '2020-11-27 01:13:43', '2020-11-29 13:55:30'),
(26, 'Kurti', 'seller', 34, 1, 1, 35, NULL, '[\"uploads\\/products\\/photos\\/KNFPXADncEeG4JOCCdjQhvOjw4EhXM8C4uKxKNhV.jpeg\",\"uploads\\/products\\/photos\\/jivWXgh8sDkkVZ6JoNEuS5pL1QI2eCZB0muOgazA.jpeg\",\"uploads\\/products\\/photos\\/yfczPmJ2K2IkZzmIi4qd1ZKeOzfZgWq7olRboI9c.jpeg\"]', 'uploads/products/thumbnail/lvBzHkvA7l5wDaUalZn7LbxXLZ0hmejn6hqjaws5.jpeg', 'youtube', NULL, 'Cotton Slub,Embroidery', 'Cross Stitch, Embroidery, Gown Style Kurti With Rayon Printed Pants, Interlocking Stitching With Bottom Double Fold Stitching.(Palazzo Pants Flayer Lenght-32Inch)', 999.00, 999.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"44\"]}]', '[]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Cross Stitch, Embroidery, Gown Style Kurti With Rayon Printed Pants, Interlocking Stitching With Bottom Double Fold Stitching.(Palazzo Pants Flayer Lenght-32Inch)', 'uploads/products/meta/ccGqjl3FnV6iFhqPXBcXoU66WK0fJ1QOqjJeHrtP.jpeg', NULL, 'Kurti-OlyLm', 0.00, NULL, 0, NULL, NULL, '2020-11-27 01:16:22', '2020-11-29 13:54:57'),
(27, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/3hv2qOHM5ynOoSLqj58Sy1S3WQXR3KCKwmw2ZutX.jpeg\",\"uploads\\/products\\/photos\\/19wI40KLWgaDDerrIpLKBpusHPSB4YHdxMUgUbI6.jpeg\"]', 'uploads/products/thumbnail/ggTnq3GuPxwC7qH5J4a3hO6F7b37a5X0PUpBtDGV.jpeg', 'youtube', NULL, 'k', NULL, 0.00, 0.00, 0, '[]', '[]', '[]', NULL, 0, 0, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', NULL, 'uploads/products/meta/Kwo5zV5oc6UwCfs9D36sDYjojAWoILaDXz9SWntl.jpeg', NULL, 'Kurti-eqTjl', 0.00, NULL, 0, NULL, NULL, '2020-11-27 03:20:23', '2020-11-27 09:39:03'),
(28, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/ErPNutc9qXK3SZLyicpQuZH7adIo1TU3JBQGaffO.jpeg\"]', 'uploads/products/thumbnail/Xe6haaBKYUG17gsuawMung6pGaxsZrfyC6HFZJrD.jpeg', 'youtube', NULL, 'k', NULL, 0.00, 0.00, 0, '[]', '[]', '[]', NULL, 0, 0, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', NULL, 'uploads/products/meta/hpmBQvMuZtBfV3tfUGU5lz37gDYbx95GUKtrNKVv.jpeg', NULL, 'Kurti-SaTqb', 0.00, NULL, 0, NULL, NULL, '2020-11-27 03:23:21', '2020-11-27 09:38:53'),
(29, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/72mTbY7PK7BkzOkrHFewPO2wmRw6ertIbEZ88zNy.jpeg\",\"uploads\\/products\\/photos\\/obNOc8TddjgJW96wGzetOGWzy9JdReSRaBLTHs0M.jpeg\"]', 'uploads/products/thumbnail/SwtFhgk9YrhpsSODRP49M7cjvNIOwGjiSfOTGBBf.jpeg', 'youtube', NULL, 'k', NULL, 0.00, 0.00, 0, '[]', '[]', '[]', NULL, 0, 0, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', NULL, 'uploads/products/meta/Poj77C3w3lPV9xI47ylrXefGZAp4w3B5JfKKPsL0.jpeg', NULL, 'Kurti-tTp61', 0.00, NULL, 0, NULL, NULL, '2020-11-27 03:27:12', '2020-11-27 09:38:45'),
(30, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/5G9BtFkfy2bkUm5bb3kUloJ2KmCD3oCemgIi0YgW.jpeg\"]', 'uploads/products/thumbnail/WCjMwbnZDkokY0KZ8FhOZgzrxoN4nEYi5JeFWDtK.jpeg', 'youtube', NULL, 'k', NULL, 0.00, 0.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', NULL, 'uploads/products/meta/oJIbyWBUDhggzvQtbhqt9qg8uCCY1rAEfvXxY949.jpeg', NULL, 'Kurti-SKap2', 0.00, NULL, 0, NULL, NULL, '2020-11-27 03:30:36', '2020-11-27 19:19:04'),
(31, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/JnwciFbgo0hZyPdIruQPyHADtNtLyBG6OX8USLDx.jpeg\",\"uploads\\/products\\/photos\\/pB6k4KBCYgkVGMyFfCEaW9XVhpeBt1dtIspCTzTW.jpeg\"]', 'uploads/products/thumbnail/3zYRHkssWdg8NpAzLrd0tKoUvHzckbyyEpcCZjts.jpeg', 'youtube', NULL, 'Cotton', '<div class=\"description_tag_line\" style=\"box-sizing: border-box; display: block; clear: both; margin-bottom: 20px; border-top: 1px solid rgb(204, 204, 204); color: rgb(86, 86, 86); font-family: SourceSansPro-Regular; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;\"><ul style=\"box-sizing: border-box; margin: 10px 0px 0px 15px; list-style: none; padding: 0px; display: block;\"><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Color:<span>&nbsp;</span>Orange</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Fabric Type:<span>&nbsp;</span>Cotton</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Length:<span>&nbsp;</span>43-44 inches</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Neck Type:<span>&nbsp;</span>Round Neck</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Size:<span>&nbsp;</span>40, 42</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Sleeve:<span>&nbsp;</span>3/4 Sleeve</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Work Type:<span>&nbsp;</span>Embroidery</li></ul></div><br class=\"Apple-interchange-newline\"><br>', 1049.00, 1049.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"40\",\"42\"]}]', '[]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Weaving Checks,Weaving Checks,Top Length : 44\"', 'uploads/products/meta/pdNwYOzOXlpxEX7Uhw3ic14wTwiXnejtNNAoM5wJ.jpeg', NULL, 'Kurti-ym7IU', 0.00, NULL, 0, NULL, NULL, '2020-11-27 11:33:32', '2020-11-29 13:53:47'),
(32, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/aJXRUuPdmLvJ5vcdz61uLjJGcY8QrVD7LmkUZpGa.jpeg\"]', 'uploads/products/thumbnail/Si6aDh4GlqX4TfvvEr8gyoMhpx7deELrLX9bYUKZ.jpeg', 'youtube', NULL, 'Cotton Silk', '<div class=\"description_tag_line\" style=\"box-sizing: border-box; display: block; clear: both; margin-bottom: 20px; border-top: 1px solid rgb(204, 204, 204); color: rgb(86, 86, 86); font-family: SourceSansPro-Regular; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;\"><ul style=\"box-sizing: border-box; margin: 10px 0px 0px 15px; list-style: none; padding: 0px; display: block;\"><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Color:<span>&nbsp;</span>Orange</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Fabric Type:<span>&nbsp;</span>Cotton Silk</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Length:<span>&nbsp;</span>Medium</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Neck Type:<span>&nbsp;</span>Round Neck</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Size:<span>&nbsp;</span>L, M, XXL</li></ul></div><br class=\"Apple-interchange-newline\"><br>', 1199.00, 1199.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"M\",\"L\",\"XXL\"]}]', '[]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Bust Size : 38\" Type : Readymade, Top Length : 44\", Bottom Waist : 36\"', 'uploads/products/meta/3BfZjyRR9qXolzx9SzC8ycZo0Q9vCajio5RiSXPf.jpeg', NULL, 'Kurti-jsGI2', 0.00, NULL, 0, NULL, NULL, '2020-11-27 11:34:51', '2020-11-29 13:53:23'),
(33, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/PYKSaB7ajFgXoEUW9Sd9gWhNuKrAfqc5H1xqf7RN.jpeg\",\"uploads\\/products\\/photos\\/eayCPxLI09FoA9P0KrbMaAx9AAp7FQLc7vztFjqv.jpeg\"]', 'uploads/products/thumbnail/ljSn5T0v9Eo4yxQhE116xfLEUKQ1Vu8PUmxlPJle.jpeg', 'youtube', NULL, 'Rayon', '<div class=\"col-lg-12 nopadding\" style=\"box-sizing: border-box; position: relative; min-height: 1px; padding: 0px; float: left; width: 449.641px; color: rgb(86, 86, 86); font-family: SourceSansPro-Regular; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;\"><section class=\"pt_description_contant\" style=\"box-sizing: border-box; display: block; max-width: 1680px; margin: auto; padding-top: 10px;\"><div class=\"description_tag_line\" style=\"box-sizing: border-box; display: block; clear: both; margin-bottom: 20px; border-top: 1px solid rgb(204, 204, 204);\"><ul style=\"box-sizing: border-box; margin: 10px 0px 0px 15px; list-style: none; padding: 0px; display: block;\"><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Color:<span>&nbsp;</span>Multi Color</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Fabric Type:<span>&nbsp;</span>Rayon</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Length:<span>&nbsp;</span>47-48 inches</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Neck Type:<span>&nbsp;</span>V Neck</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Size:<span>&nbsp;</span>42, 40</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Sleeve:<span>&nbsp;</span>Full Sleeve</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Work Type:<span>&nbsp;</span>Embroidery</li></ul></div><div class=\"clearfix\" style=\"box-sizing: border-box;\"><br></div></section></div><div class=\"col-sm-12 nopadding\" style=\"box-sizing: border-box; position: relative; min-height: 1px; padding: 0px; float: left; width: 449.641px; color: rgb(86, 86, 86); font-family: SourceSansPro-Regular; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;\"><p style=\"box-sizing: border-box; margin: 0px 0px 0.25cm; line-height: 16.8px;\"><br></p><br><br><table style=\"box-sizing: border-box; border-spacing: 0px; border-collapse: collapse; background-color: transparent;\"></table></div><div class=\"clearfix\" style=\"box-sizing: border-box; color: rgb(86, 86, 86); font-family: SourceSansPro-Regular; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;\"><br></div><div class=\"col-sm-12 nopadding\" style=\"box-sizing: border-box; position: relative; min-height: 1px; padding: 0px; float: left; width: 449.641px; color: rgb(86, 86, 86); font-family: SourceSansPro-Regular; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;\"><div style=\"box-sizing: border-box;\"><br class=\"Apple-interchange-newline\"></div></div>', 1199.00, 1199.00, 1, '[\"1\",\"3\"]', '[{\"attribute_id\":\"1\",\"values\":[\"40\",\"42\"]},{\"attribute_id\":\"3\",\"values\":[\"Multi Color\"]}]', '[]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Kurti:- Rayon 14 Kg With Rayon 14 Kg Dyed, Kurti:- Rayon 14 Kg With Rayon 14 Kg Dyed Top Length : 48\"', 'uploads/products/meta/eSs4hQKmJpGzMWHs9Ircj1n48pmrPAC7A72TuTfT.jpeg', NULL, 'Kurti-NLu17', 0.00, NULL, 0, NULL, NULL, '2020-11-27 11:36:41', '2020-11-29 23:49:21'),
(34, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/9p7RsnThYhvDGQWfcerkFCZbe0Um96GlGD4Jm9Yk.jpeg\"]', 'uploads/products/thumbnail/4srUsDTRZw5F3AEuRQJz9log3Eba48Jbu0rtnV4X.jpeg', 'youtube', NULL, 'Cotton', '<ul style=\"box-sizing: border-box; margin: 10px 0px 0px 15px; list-style: none; padding: 0px; display: block; color: rgb(86, 86, 86); font-family: SourceSansPro-Regular; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;\"><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Color:<span>&nbsp;</span>Light pink</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Fabric Type:<span>&nbsp;</span>Cotton</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Neck Type:<span>&nbsp;</span>Round Neck</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Size:<span>&nbsp;</span>XL, XXL</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Sleeve:<span>&nbsp;</span>3/4 Sleeve</li></ul><br>', 1599.00, 1599.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"XL\",\"XXL\"]}]', '[]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Interlocking-White / Other Thread', 'uploads/products/meta/2NXTKYKQff5Xxni2fxaOothGOwOUkbZvGhu0uTXY.jpeg', NULL, 'Kurti-TOtGP', 0.00, NULL, 0, NULL, NULL, '2020-11-27 11:39:05', '2020-11-29 13:52:38'),
(35, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/TCGqlIBnbonwQJqyPoDzeyIhbx3sbPrg6alSU0nF.jpeg\"]', 'uploads/products/thumbnail/fODKFvxUaKUdGIgYAd7EUwZrL6XOohUfa5KMIioY.jpeg', 'youtube', NULL, 'Cotton', '<ul style=\"box-sizing: border-box; margin: 10px 0px 0px 15px; list-style: none; padding: 0px; display: block; color: rgb(86, 86, 86); font-family: SourceSansPro-Regular; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;\"><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Color:<span>&nbsp;</span>Lime Green</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Fabric Type:<span>&nbsp;</span>Cotton</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Neck Type:<span>&nbsp;</span>Round Neck</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Size:<span>&nbsp;</span>L</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Sleeve:<span>&nbsp;</span>3/4 Sleeve</li></ul><br>', 1499.00, 1499.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"L\"]}]', '[]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Interlocking-White / Other Thread', 'uploads/products/meta/1z8jn0QRSHDuIgQyPL7vc3mruV0u1OMmTDfnJm9w.jpeg', NULL, 'Kurti-oTEDn', 0.00, NULL, 0, NULL, NULL, '2020-11-27 11:42:35', '2020-11-29 13:52:16'),
(36, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/RgNbIW86gqkp3iapGHANhjfLtmkK6GLZgm5uPoDI.jpeg\",\"uploads\\/products\\/photos\\/hfsl3qmbkKeqM5EyjmIcH2D9htg9EXdp9QQ4iLRY.jpeg\"]', 'uploads/products/thumbnail/CgMuyFatk0ssV5lS6Qd5nFKRZaa7KzaGjQYNh3QD.jpeg', 'youtube', NULL, 'Rayon,Half Sleeve, Embroidery', '<ul style=\"box-sizing: border-box; margin: 10px 0px 0px 15px; list-style: none; padding: 0px; display: block; color: rgb(86, 86, 86); font-family: SourceSansPro-Regular; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;\"><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Color:<span>&nbsp;</span>Blue</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Fabric Type:<span>&nbsp;</span>Rayon</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Length:<span>&nbsp;</span>47-48 inches</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Neck Type:<span>&nbsp;</span>Shirt Collar</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Size:<span>&nbsp;</span>42, 40, 44</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Sleeve:<span>&nbsp;</span>Half Sleeve</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Work Type:<span>&nbsp;</span>Embroidery</li></ul>', 999.00, 999.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"40\",\"42\",\"44\"]}]', '[]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Kurti:- Rayon 14 Kg With Rayon 14 Kg Dyed, Kurti:- Rayon 14 Kg With Rayon 14 Kg Dyed, Top Length : 48\"', 'uploads/products/meta/daNXxpb82sJZyJOjdRGgn04AvW6r0g8uAAORjJtL.jpeg', NULL, 'Kurti-74mKX', 0.00, NULL, 0, NULL, NULL, '2020-11-27 11:44:03', '2020-11-29 13:51:46'),
(37, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/TrUdvoCY61ROzhgOwx0fa3VIQeg2rtWoRlU1fspy.jpeg\",\"uploads\\/products\\/photos\\/MaI0LPTzXrpZSVhdE1LcCR2T6RQblWUSCL9sfSV5.jpeg\",\"uploads\\/products\\/photos\\/XeMxPdXqNeP2FGIcBr0I4yiO8nuNDl2pnU8O2gAO.jpeg\",\"uploads\\/products\\/photos\\/5Uef2P2pm0xa1bVdbhMjSi39wNgOGnLQF2uYT4r0.jpeg\",\"uploads\\/products\\/photos\\/1PWFINKD8V2cWsfz8mSWNBLHBAEbOwcnAsL3yO1J.jpeg\",\"uploads\\/products\\/photos\\/lB19secTWjBQOzVd00INEzSftfVQ4eON3vKSY845.jpeg\"]', 'uploads/products/thumbnail/LLHayfZJACyVZpWZziK2TEWoYgdKeqEEhQDFlF0x.jpeg', 'youtube', NULL, 'Cotton,Hand Embroidery', '<div class=\"description_tag_line\" style=\"box-sizing: border-box; display: block; clear: both; margin-bottom: 20px; border-top: 1px solid rgb(204, 204, 204); color: rgb(86, 86, 86); font-family: SourceSansPro-Regular; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;\"><ul style=\"box-sizing: border-box; margin: 10px 0px 0px 15px; list-style: none; padding: 0px; display: block;\"><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Color:<span>&nbsp;</span>Pink</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Fabric Type:<span>&nbsp;</span>Cotton</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Length:<span>&nbsp;</span>49 inches or more</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Neck Type:<span>&nbsp;</span>Round Neck</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Size:<span>&nbsp;</span>40, 44, 38, 42</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Sleeve:<span>&nbsp;</span>3/4 Sleeve</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Style:<span>&nbsp;</span>Flared</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Work Type:<span>&nbsp;</span>Hand Embroidery</li></ul></div><br class=\"Apple-interchange-newline\"><br>', 1349.00, 1349.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"38\",\"40\",\"42\",\"44\"]}]', '[]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Checkered Yarn Dyed With Hand Embroidery And Muslin Inner, Interlocking-Same Thread, Side Slit Protection Stitching\r\nColor Pink, length - 54', 'uploads/products/meta/mnxqeagfWSAjsVb77j57tfujcFkaBuT1lGrOjq2n.jpeg', NULL, 'Kurti-V22iO', 0.00, NULL, 0, NULL, NULL, '2020-11-27 12:27:37', '2020-11-29 13:51:19'),
(38, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/c5mbGnaKqtSil0gneR4PjZBWnYzU96Oa1TNaWz9m.jpeg\",\"uploads\\/products\\/photos\\/Ad7fbyFkAnHyFHJD8xvWDztLg6GPaVNOxFTnKY2f.jpeg\",\"uploads\\/products\\/photos\\/GH8VCMJnm955n5wZUffBLgLj7hBLEQjR1I9BPyEh.jpeg\",\"uploads\\/products\\/photos\\/5aIUyyrXG67di7XP4gvefjnYbXzmsbFREG1MjsK0.jpeg\",\"uploads\\/products\\/photos\\/lVJDTtmirVZWg9gO8edszcgrz9grrbPcoToBE0IB.jpeg\"]', 'uploads/products/thumbnail/f0ArAQye1992EzUaG47KoKbxynjr5CzPqBWHpjig.jpeg', 'youtube', NULL, 'Cotton', '<div class=\"description_tag_line\" style=\"box-sizing: border-box; display: block; clear: both; margin-bottom: 20px; border-top: 1px solid rgb(204, 204, 204); color: rgb(86, 86, 86); font-family: SourceSansPro-Regular; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;\"><ul style=\"box-sizing: border-box; margin: 10px 0px 0px 15px; list-style: none; padding: 0px; display: block;\"><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Color:<span>&nbsp;</span>Green</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Fabric Type:<span>&nbsp;</span>Cotton</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Length:<span>&nbsp;</span>49 inches or more</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Neck Type:<span>&nbsp;</span>Round Neck</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Size:<span>&nbsp;</span>40, 44, 38, 42</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Sleeve:<span>&nbsp;</span>3/4 Sleeve</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Style:<span>&nbsp;</span>Flared</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Work Type:<span>&nbsp;</span>Hand Embroidery</li></ul></div><br class=\"Apple-interchange-newline\"><br>', 1449.00, 1449.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"38\",\"40\",\"42\",\"44\"]}]', '[]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Checkered Yarn Dyed With Hand Embroidery And Muslin Inner, Interlocking-Same Thread, Side Slit Protection Stitching', 'uploads/products/meta/QC1xNejrFhQbNOjdKFtqkAHlGn94ABKnqZemQI9O.jpeg', NULL, 'Kurti-O2EIn', 0.00, NULL, 0, NULL, NULL, '2020-11-27 12:35:08', '2020-11-29 13:50:56');
INSERT INTO `products` (`id`, `name`, `added_by`, `user_id`, `category_id`, `subcategory_id`, `subsubcategory_id`, `brand_id`, `photos`, `thumbnail_img`, `video_provider`, `video_link`, `tags`, `description`, `unit_price`, `purchase_price`, `variant_product`, `attributes`, `choice_options`, `colors`, `variations`, `todays_deal`, `published`, `featured`, `current_stock`, `unit`, `min_qty`, `discount`, `discount_type`, `tax`, `tax_type`, `shipping_type`, `shipping_cost`, `num_of_sale`, `meta_title`, `meta_description`, `meta_img`, `pdf`, `slug`, `rating`, `barcode`, `digital`, `file_name`, `file_path`, `created_at`, `updated_at`) VALUES
(39, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/zC0MfqJv9PYSfq7JTebsZjbz6nKIPGzugq0eTyN4.jpeg\",\"uploads\\/products\\/photos\\/hsjWFvjfunOcZDHEIGSugCjlU1xrYI90of33E91P.jpeg\",\"uploads\\/products\\/photos\\/1gHYp4EbTDbYrGfUCnYCY52zJHO5WqYwW6wBv7N6.jpeg\",\"uploads\\/products\\/photos\\/YUvpNNf9nIAYTZwYvJwAu1NMSaSLMyNm3TNXwhzW.jpeg\",\"uploads\\/products\\/photos\\/Gvog9SIJQ3cvIjktbtOiKxt8TU4ubiHaeiIFmF5N.jpeg\",\"uploads\\/products\\/photos\\/XMOISB3RtEjdtM2wpo1VLdGx7stXET9aaGM9lYkj.jpeg\",\"uploads\\/products\\/photos\\/H1PYgFIBXanfzsKxt4g5Ny99sxhL3boQeHPzYnRJ.jpeg\"]', 'uploads/products/thumbnail/dLL5ZDD8lSWyYdDptimvqoobMxQX73LDc25SaWob.jpeg', 'youtube', NULL, 'Cambric', '<p><br></p><div class=\"col-lg-12 nopadding\" style=\"box-sizing: border-box; position: relative; min-height: 1px; padding: 0px; float: left; width: 449.641px; color: rgb(86, 86, 86); font-family: SourceSansPro-Regular; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;\"><section class=\"pt_description_contant\" style=\"box-sizing: border-box; display: block; max-width: 1680px; margin: auto; padding-top: 10px;\"><div class=\"description_tag_line\" style=\"box-sizing: border-box; display: block; clear: both; margin-bottom: 20px; border-top: 1px solid rgb(204, 204, 204);\"><ul style=\"box-sizing: border-box; margin: 10px 0px 0px 15px; list-style: none; padding: 0px; display: block;\"><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Color:<span>&nbsp;</span>Grey</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Fabric Type:<span>&nbsp;</span>Cambric</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Length:<span>&nbsp;</span>48-49 Inches</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Neck Type:<span>&nbsp;</span>Mandarin Collar</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Size:<span>&nbsp;</span>38, 42, 40, 44</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Sleeve:<span>&nbsp;</span>Half Sleeve</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Style:<span>&nbsp;</span>Anarkali</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Work Type:<span>&nbsp;</span>Printed</li></ul></div><div class=\"clearfix\" style=\"box-sizing: border-box;\"><br></div></section></div><div class=\"col-sm-12 nopadding\" style=\"box-sizing: border-box; position: relative; min-height: 1px; padding: 0px; float: left; width: 449.641px; color: rgb(86, 86, 86); font-family: SourceSansPro-Regular; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;\"><br class=\"Apple-interchange-newline\"></div>', 1349.00, 1349.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"38\",\"40\",\"42\",\"44\"]}]', '[]', NULL, 0, 1, 1, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Grey With Mustard Screen Printed Anarkali Kurti With Mustard Pallazo, Interlocking-Same Thread, Side Slit Protection Stitching,Hand Wash In Cold Water', 'uploads/products/meta/6nHrZhB6lTXk06QgzrJRBT2R0Uqf7abddkLghM7A.jpeg', NULL, 'Kurti-uOTLh', 0.00, NULL, 0, NULL, NULL, '2020-11-27 12:39:48', '2020-12-04 10:18:45'),
(40, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/K5tFa7Z1efptNy1SXONDL8kRTAtcqyqnS5aphoaU.jpeg\",\"uploads\\/products\\/photos\\/wKN8Y3BU0QO82xzIr04FVB9qQ6kHUUsQthAzO7pK.jpeg\",\"uploads\\/products\\/photos\\/ySbAMfjeAkntVl6izdSVn1jkR2RWjSDpozLuANvP.jpeg\",\"uploads\\/products\\/photos\\/hgZXlCwMQ5sNy41YtOL70mbk0rkGEdlYn7lrcRAB.jpeg\",\"uploads\\/products\\/photos\\/cpKurHZMWnh7Inb63ji5uqJGLNLp5EhKLYujimM8.jpeg\",\"uploads\\/products\\/photos\\/gcqzw6Kue3CLsVO5yH8xhOElTHdZUzXIlqVNRLPo.jpeg\"]', 'uploads/products/thumbnail/qFrhVSMexqwfuNcxYNJZQSleZWn9H0IofDNWkc9Q.jpeg', 'youtube', NULL, 'Modal', '<ul style=\"box-sizing: border-box; margin: 10px 0px 0px 15px; list-style: none; padding: 0px; display: block; color: rgb(86, 86, 86); font-family: SourceSansPro-Regular; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;\"><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Color:<span>&nbsp;</span>Red</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Fabric Type:<span>&nbsp;</span>Modal</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Length:<span>&nbsp;</span>49 inches or more</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Neck Type:<span>&nbsp;</span>V Neck</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Size:<span>&nbsp;</span>38, 42, 40, 44</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Sleeve:<span>&nbsp;</span>3/4 Sleeve</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Style:<span>&nbsp;</span>Flared</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Work Type:<span>&nbsp;</span>Embroidery</li></ul><br>', 1549.00, 1549.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"38\",\"40\",\"42\",\"44\"]}]', '[]', NULL, 0, 1, 1, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Brick Red And Yellow Printed Modal Satin With Highlight Hand Work Dress, Interlocking-Same Thread, Side Slit Protection Stitching, Dry Clean Only; Length: 56 Inches', 'uploads/products/meta/7RUDMY4X66wlvaT92rmuwG3nu3f85EenSBpokW5W.jpeg', NULL, 'Kurti-FKjSD', 0.00, NULL, 0, NULL, NULL, '2020-11-27 12:44:50', '2020-12-04 10:18:46'),
(41, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/Bad3PUriCJcyfJwzdKQxKZwyvMuimuQfGKWe9cNN.jpeg\",\"uploads\\/products\\/photos\\/A2zwY66oZdfzbptw3nUhmq5zwQPDQ7vrlW6fOH3Z.jpeg\",\"uploads\\/products\\/photos\\/IRRkzNUVIHwt3VVL0HS2g6OzfTojaa8UYnPC3xHg.jpeg\",\"uploads\\/products\\/photos\\/IgAWMLCIjH4tptHcDRGsFTmh97fpH32aE7aKfwqA.jpeg\"]', 'uploads/products/thumbnail/f5uHAzl8TOZVMDnSrsxRvji67ylmfqGCBm4qZMiZ.jpeg', 'youtube', NULL, 'Rayon', '<p><br></p><div class=\"description_tag_line\" style=\"box-sizing: border-box; display: block; clear: both; margin-bottom: 20px; border-top: 1px solid rgb(204, 204, 204); color: rgb(86, 86, 86); font-family: SourceSansPro-Regular; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;\"><ul style=\"box-sizing: border-box; margin: 10px 0px 0px 15px; list-style: none; padding: 0px; display: block;\"><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Color:<span>&nbsp;</span>Bottle Green</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Fabric Type:<span>&nbsp;</span>Rayon</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Length:<span>&nbsp;</span>49 inches or more</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Neck Type:<span>&nbsp;</span>Mandarin Collar</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Size:<span>&nbsp;</span>38, 42, 40, 44</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Sleeve:<span>&nbsp;</span>3/4 Sleeve</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Style:<span>&nbsp;</span>Anarkali</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Work Type:<span>&nbsp;</span>Printed</li></ul></div><br><p><br></p>', 1199.00, 1199.00, 1, '[\"1\",\"3\"]', '[{\"attribute_id\":\"1\",\"values\":[\"38\",\"40\",\"42\",\"44\"]},{\"attribute_id\":\"3\",\"values\":[\"Bottle Green\"]}]', '[]', NULL, 1, 1, 1, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Rayon Bottle Green white leaves printed dress, Interlocking-Same Thread, Side Slit Protection Stitching,Hand Wash In Cold Water', 'uploads/products/meta/hYiP0YKUlmvkJzHetR6CHSed38qbEN9Rhhmnn0Zb.jpeg', NULL, 'Kurti-6xaEM', 0.00, NULL, 0, NULL, NULL, '2020-11-27 12:49:19', '2020-12-04 10:18:43'),
(42, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/y9vevDTa0M4MkHVRErs0WAg6xbd3dQiavJkHdGBk.jpeg\",\"uploads\\/products\\/photos\\/858h8Nbrln4czfDPMI5RlumOOvv1Qj60pbaneBC0.jpeg\",\"uploads\\/products\\/photos\\/EQgtxoPZOjSVvXWWgjM4saSQWGLwbAJEt6ihqq5Z.jpeg\",\"uploads\\/products\\/photos\\/I5Z8aaMN0MOgcPIipl4MZq3T0nyb3xtm8daLZjF9.jpeg\",\"uploads\\/products\\/photos\\/jTKndfW1YAZwVgvmpbMO8ZVnqiGkVBcjqVX1tevE.jpeg\",\"uploads\\/products\\/photos\\/0pztJzAksQqJLxoUvMt94zWFvhusi2YIns0SFLQu.jpeg\"]', 'uploads/products/thumbnail/A6Sr99QxpxJl01c5kYOyVIaTtd8Dii4eq6o4wqfJ.jpeg', 'youtube', NULL, 'Embroidery', '<ul style=\"box-sizing: border-box; margin: 10px 0px 0px 15px; list-style: none; padding: 0px; display: block; color: rgb(86, 86, 86); font-family: SourceSansPro-Regular; font-size: 14px; font-style: normal; font-variant-ligatures: normal; font-variant-caps: normal; font-weight: 400; letter-spacing: normal; orphans: 2; text-align: start; text-indent: 0px; text-transform: none; white-space: normal; widows: 2; word-spacing: 0px; -webkit-text-stroke-width: 0px; background-color: rgb(255, 255, 255); text-decoration-thickness: initial; text-decoration-style: initial; text-decoration-color: initial;\"><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Fabric Type:<span>&nbsp;</span>Cotton</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Length:<span>&nbsp;</span>49 inches or more</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Neck Type:<span>&nbsp;</span>Mandarin Collar</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Size:<span>&nbsp;</span>38, 42, 40, 44</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Sleeve:<span>&nbsp;</span>3/4 Sleeve</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Style:<span>&nbsp;</span>A - line</li><li style=\"box-sizing: border-box; margin: 0px 0px 9px; list-style: outside; min-width: 50%; float: left;\">Work Type:<span>&nbsp;</span>Embroidery</li></ul><br>', 1349.00, 1349.00, 1, '[\"3\",\"1\"]', '[{\"attribute_id\":\"3\",\"values\":[\"Lemon\"]},{\"attribute_id\":\"1\",\"values\":[\"38\",\"40\",\"42\",\"44\"]}]', '[]', NULL, 1, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Color- Lemon, Interlocking-Same Thread, Side Slit Protection Stitching, Hand Wash In Cold Water, Length: 50 Inches', 'uploads/products/meta/U3KURIp2Hn6uD6nzcYqnUqVoduxnpNe9QZ8j58bs.jpeg', NULL, 'Kurti-q7eWB', 0.00, NULL, 0, NULL, NULL, '2020-11-27 12:51:25', '2020-11-29 13:48:43'),
(43, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/yJpFBaOVs0yD864JxFML6l6nb5rFMLa6cDixAaQv.jpeg\",\"uploads\\/products\\/photos\\/bQUw0hodBpXxpuIC25Onu2ovcpYv68TqShxhaXEJ.jpeg\"]', 'uploads/products/thumbnail/IzkId4g4vSTt3h5xe8HAO8IZ57nEg5A0J5EOuegd.jpeg', 'youtube', NULL, 'Chanderi', '<ul><li>Color: Green Fabric&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Type: Chanderi</li><li>Length: 48-49 Inches&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Neck Type: Round Neck With V Slit</li><li>Size: 42, 40&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;Sleeve: 3/4 </li><li>SleeveStyle: Straight&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; Work Type: Sequence, Hand Block Printed\r\n</li></ul>', 1099.00, 1099.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"40\",\"42\"]}]', '[]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Fabric - Chanderi Kurti with Cotton Lining \r\n\r\nSize Options- L(40”), XL (42”),', 'uploads/products/meta/X30XP6EJzEKX0TKN69ndA5zXkRKYA9ndmHdabRqI.jpeg', NULL, 'Kurti-KTiUy', 0.00, NULL, 0, NULL, NULL, '2020-11-27 12:56:01', '2020-11-29 13:47:49'),
(44, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/FoX2khBx38gM3JYZ3deJVH5D8AqDLz70MJyGMY08.jpeg\",\"uploads\\/products\\/photos\\/e2OskHKhWEFXSUl1LtSzSgMlsR7tUwQ6fkxttxb9.jpeg\",\"uploads\\/products\\/photos\\/2fcoc2LwOOTFhGYVI7nFVfIPrM6TFCzRGmHdJzoB.jpeg\"]', 'uploads/products/thumbnail/wcm9bCOGZZccLZMQOvzu8CfcSFAPlOLKYQmphOBZ.jpeg', 'youtube', NULL, 'Rayon,Printed', 'Interlocking Stitching With Bottom Double Fold Stitching.', 1049.00, 1049.00, 1, '[\"1\",\"2\"]', '[{\"attribute_id\":\"1\",\"values\":[\"38\"]},{\"attribute_id\":\"2\",\"values\":[\"Rayon\"]}]', '[]', NULL, 1, 1, 1, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Interlocking Stitching With Bottom Double Fold Stitching.', 'uploads/products/meta/RmmY1jHyRBdJwvAdcu2iu2A2YNRk5EUfiIp0DHnA.jpeg', NULL, 'Kurti-Js79D', 0.00, NULL, 0, NULL, NULL, '2020-11-27 12:57:39', '2020-12-04 10:18:40'),
(45, 'Kurti', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/44cDKRn6Qe5L6GxDVYDvWJVok9ko3L10d3Zi36a9.jpeg\",\"uploads\\/products\\/photos\\/l8k9SDddwFeA0HABUKZIRFSIbGpUk5oFKrAQaxFS.jpeg\",\"uploads\\/products\\/photos\\/jQziflyZZ7tOulZ6BDVvAGsdEvePz6EErvdJnEEG.jpeg\",\"uploads\\/products\\/photos\\/mfGYfGtUg8xnK1sLgQJE4SM5ziShwfu4NrDaG7xx.jpeg\",\"uploads\\/products\\/photos\\/HC85xcFTBvz34ALpoB4nxaB8RLvJKEGKftzImT48.jpeg\"]', 'uploads/products/thumbnail/U7kujQupCwb1Dq7uldHfgye8GNLnzOs9JDacPqKd.jpeg', 'youtube', NULL, 'Hand Work,Rayon', 'Interlocking Stitching With Bottom Double Fold Stitching.', 1099.00, 1099.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"S\",\"M\",\"XXL\"]}]', '[]', NULL, 1, 1, 1, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurti', 'Interlocking Stitching With Bottom Double Fold Stitching.', 'uploads/products/meta/zlCkRWFqptX7kN33N86y3AEAQVY0QHdtKiXg0Q4m.jpeg', NULL, 'Kurti-fJ6fx', 0.00, NULL, 0, NULL, NULL, '2020-11-27 13:03:16', '2020-11-30 12:53:17'),
(46, 'Kurti', 'seller', 34, 1, 1, 35, NULL, '[\"uploads\\/products\\/photos\\/t8Z2heJLbD4IYfpoSidEwpUskcZRbHEGdGCaJSrp.jpeg\",\"uploads\\/products\\/photos\\/3pSFaCwSpPvB6bXYdEojF7pfeC2Evxz28bTifAH0.jpeg\"]', 'uploads/products/thumbnail/W14n3afcDCHsb3lKisCm7xZRyV8l3BmBWy8wcDpy.jpeg', 'youtube', NULL, 'Printed,Rayon', '<p>Kurti</p><p>Rayon</p><p>Printed</p><p><br></p>', 899.00, 899.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"44\"]}]', '[]', NULL, 1, 1, 1, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 1, 'Kurti , Rayon , Printed', 'Printed\r\nRayon', 'uploads/products/meta/LzPh9LwH7emUdXCtCqENjR32MOBMI6FXxcAXd5MH.jpeg', NULL, 'Kurti-Q1q8z', 0.00, NULL, 0, NULL, NULL, '2020-11-27 13:11:07', '2020-12-04 10:18:39'),
(47, 'Aishani Superior Women Lehenga', 'seller', 35, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/uTZFfD13hzYVe2MftwBz3gR7BXoLZ7QBDOTfeOE2.jpeg\",\"uploads\\/products\\/photos\\/F2mWajFPyTkstEYuHxNMbrmyol3XkXAevT51xwGj.jpeg\",\"uploads\\/products\\/photos\\/LpAbUW7aTwbQZQRfx9TCG0Ku1oOD4z0WwMbF9lh5.jpeg\",\"uploads\\/products\\/photos\\/mDgcgnTMN2lmZFsjz1uGszywKjAnIhxVXpja1ApZ.jpeg\"]', 'uploads/products/thumbnail/SXWfjqhiRidA95lDiITOl7Ua81vyWCjOBx6IsJGw.jpeg', 'youtube', NULL, 'Ethnic Wear', '<strong></strong>', 1500.00, 1500.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 1, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Women Lehenga', 'Catalog Name:*Aishani Superior Women Lehenga*\r\nTopwear Fabric: Velvet\r\nBottomwear Fabric: Velvet\r\nDupatta Fabric: Net\r\nSet type: Choli And Dupatta\r\nSizes: \r\nFree Size (Lehenga Waist Size: 44 in, Lehenga Length Size: 44 in) \r\n\r\nDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any Issue', 'uploads/products/meta/xLdMEbfvJbiI6NlNXbc5P50YdVPuxk94hHwNQ1IP.jpeg', NULL, 'Aishani-Superior-Women-Lehenga-eTreO', 0.00, NULL, 0, NULL, NULL, '2020-11-29 22:40:27', '2020-11-29 22:40:27'),
(48, 'Alloy Women\'s Earrings', 'seller', 35, 1, 2, 6, NULL, '[\"uploads\\/products\\/photos\\/Fsm60LmHobAFvx0KyR6Y02mpO7cS50YXOTwNg1zt.jpeg\",\"uploads\\/products\\/photos\\/snY62cG7xsz9fy0Kg4qfbfKmhgiBu5vWmbffEOKW.jpeg\",\"uploads\\/products\\/photos\\/J4nHk6AuFBVgCW4J7RLs7NN1wm6Sf3zXcVoMDciO.jpeg\",\"uploads\\/products\\/photos\\/nIRm9zwRWT75y20UGiYjmlJk84rIYXvaI88KfwwN.jpeg\",\"uploads\\/products\\/photos\\/Nsjlfi3go7JIcOFfl2FWKWsTvBGZK5tn3xrhpxbG.jpeg\"]', 'uploads/products/thumbnail/L5FZ96N6KEo3YU1wk4Ok907XMdWGhtKyLYihF3gl.jpeg', 'youtube', NULL, 'New Attractive women Earrings', NULL, 300.00, 300.00, 0, '[]', '[]', '[]', NULL, 0, 1, 1, 1, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'New Attractive Alloy Women\'s Earrings', 'New Attractive Alloy Women\'s Earrings\r\n\r\nMaterial: Alloy\r\nSize: Free Size\r\nDescription: It Has 1 Pair Of Women\'s Earring\r\nWork: Stone & Beads Work\r\nPrice : Rs. 300 and above', 'uploads/products/meta/BB8zdFoB99V2y27yqWfmUBRT5NPAaJ2Uo9arJU7D.jpeg', NULL, 'Alloy-Womens-Earrings-yMMne', 0.00, NULL, 0, NULL, NULL, '2020-11-29 22:56:11', '2020-11-30 12:53:14'),
(49, 'Cotton Doby', 'seller', 34, 2, 4, 11, NULL, '[\"uploads\\/products\\/photos\\/FVZcwaDnsPnVCsVXywgWvF1kF6nUY8AFZyqQzr2i.jpeg\"]', 'uploads/products/thumbnail/KObe7aTt8farV3Klb9ilidYqBZ9ooyS4iTB0ReWS.jpeg', 'youtube', NULL, 'Trouser', '<p>Cotton Dobby</p><p>Regular fit</p>', 600.00, 600.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"30\"]}]', '[\"#0000FF\"]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Cotton Dobby', 'Cotton Dobby\r\nRegular Fit', 'uploads/products/meta/Oh3UGB7zIBfC2LcawkV0LKSZEArlbksI47LlRhWV.jpeg', NULL, 'Cotton-Doby-avrvG', 0.00, NULL, 0, NULL, NULL, '2020-11-29 23:03:26', '2020-11-29 23:03:26'),
(50, 'Cotton Doby', 'seller', 34, 2, 4, 11, NULL, '[\"uploads\\/products\\/photos\\/vWv7DHoEF1803uCWhPIz3AIkKX4WqnasFEB0gt2b.jpeg\"]', 'uploads/products/thumbnail/6mR2rChPwjvZ2TXSwx0i37imPzvU9OqQn1qsMKW1.jpeg', 'youtube', NULL, 'Cotton, Regular Fit', '<p>Cotton Dobby</p><p><span style=\"font-size: 0.8125rem;\">Regular Fit</span><br></p>', 649.00, 649.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"30\"]}]', '[\"#000000\"]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Cotton Dobby', 'Cotton Dobby\r\n\r\nRegular Fit', 'uploads/products/meta/oKHYkTGDjmt7OFKLsqbYyi366ULIGf0pezLc0WtZ.jpeg', NULL, 'Cotton-Doby-2Ki5m', 0.00, NULL, 0, NULL, NULL, '2020-11-29 23:07:06', '2020-11-29 23:07:07'),
(51, 'Solid Cotton Trouser', 'seller', 34, 2, 4, 11, NULL, '[\"uploads\\/products\\/photos\\/OGRhxXrHdX6fCiAuc2F7HRhufMuEq1yXrUQxtOVS.jpeg\"]', 'uploads/products/thumbnail/6w7o2vkhBD0WzGSxSh0l9JyfjLJcMRsY6n7EvjJh.jpeg', 'youtube', NULL, 'Trouser', 'Cotton Trouser', 599.00, 599.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"30\"]}]', '[\"#808080\"]', NULL, 0, 1, 1, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Trouser', 'Cotton Trouser', 'uploads/products/meta/XLnlvNdjNAoBw9YyRZLaq3Bgb5HuNpHsBJb4oO0E.jpeg', NULL, 'Solid-Cotton-Trouser-K1yS4', 0.00, NULL, 0, NULL, NULL, '2020-11-29 23:12:47', '2020-12-04 10:18:31'),
(52, 'Solid Cotton Trouser', 'seller', 34, 2, 4, 11, NULL, '[\"uploads\\/products\\/photos\\/vnK7ZkiJBpAhwqH8GaG4ZLheGUhJoXZXYFHXQLsi.jpeg\"]', 'uploads/products/thumbnail/SwjZPBjIErjvRgQvDWjNfleSbZL2k5R6htEQkkIM.jpeg', 'youtube', NULL, 'Trouser', 'Cotton Trouser', 599.00, 599.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"30\"]}]', '[\"#000000\"]', NULL, 0, 1, 1, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Trouser', 'Cotton Trouser', 'uploads/products/meta/3MwFIUSSwOWntwrIo9ipxpgCuMxVb7Jjf8gUETHx.jpeg', NULL, 'Solid-Cotton-Trouser-hv1sh', 0.00, NULL, 0, NULL, NULL, '2020-11-29 23:16:18', '2020-11-30 12:53:10'),
(53, 'Polo T-Shirt', 'seller', 34, 2, 4, 10, NULL, '[\"uploads\\/products\\/photos\\/xzYTiTiKlPNezl5xsiGph9FTeXc8WLGAeGhHsqIK.jpeg\"]', 'uploads/products/thumbnail/4nRMpPj6AJSflNcTax3fh20JRzgorNlHS3nJB4Hl.jpeg', 'youtube', NULL, 'Half Sleeve', '<p>Polo T-Shirt</p><p>Half Sleeve</p>', 449.00, 449.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"40\"]}]', '[\"#6495ED\"]', NULL, 0, 1, 1, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Polo T-Shirt', 'Cotton Polo T-Shirt\r\nHalf Sleeve', 'uploads/products/meta/DiSCk2oqSt8JD7J6L4RCOr8a5ND94yVyjbw1Vxz3.jpeg', NULL, 'Polo-T-Shirt-FG0kZ', 0.00, NULL, 0, NULL, NULL, '2020-11-29 23:23:55', '2020-12-04 10:18:32'),
(54, 'Matty Solid T-Shirt', 'seller', 34, 2, 4, 10, NULL, '[\"uploads\\/products\\/photos\\/NsysZgorUkinsVhYqrRh4vsT2ohOhjOpHhr32Rvj.jpeg\"]', 'uploads/products/thumbnail/LvM3upSWdaAhydEAIcsHfbBxcMWgp0c839molaxG.jpeg', 'youtube', NULL, 'Matty, T-Shirt', 'Matty Solid T-Shirt', 479.00, 479.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"38\"]}]', '[\"#FFA500\"]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Matty Solid T-Shirt', 'Matty Solid T-Shirt\r\nHalf Sleeve', 'uploads/products/meta/pEovFEUjzkyzXv9oPLghrEl3IAYVX3qa2iUXDZtE.jpeg', NULL, 'Matty-Solid-T-Shirt-ouE6i', 0.00, NULL, 0, NULL, NULL, '2020-11-29 23:28:12', '2020-11-29 23:28:12'),
(55, 'Cotton Solid T-Shirt', 'seller', 34, 2, 4, 10, NULL, '[\"uploads\\/products\\/photos\\/WydFCWVQiJVgpCzxdR3fviuaeQGbbddY3uXh0lHx.jpeg\"]', 'uploads/products/thumbnail/Cvr846327Ihbx1PrHJfoD7AwD95L33z3QfKzGECz.jpeg', 'youtube', NULL, 'Cotton, T-Shirt', 'Cotton Solid T-Shirt', 299.00, 299.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"38\"]}]', '[\"#808080\"]', NULL, 0, 1, 1, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Cotton Solid T-Shirt', 'Cotton Solid T-Shirt', 'uploads/products/meta/7M857BeefRbkwDqIjuCK47TEXQx1nYSGciKl5GeP.jpeg', NULL, 'Cotton-Solid-T-Shirt-csV9L', 0.00, NULL, 0, NULL, NULL, '2020-11-29 23:33:02', '2020-11-30 12:53:06'),
(56, 'Cotton Solid T-Shirt', 'seller', 34, 2, 4, 10, NULL, '[\"uploads\\/products\\/photos\\/lhBmALTLKSEaGyJoXDoWbg7sHeMjw0qhgKZP7KX7.jpeg\"]', 'uploads/products/thumbnail/LYGSFqY1PWdKIDBJwPGsIj1H7BRotfVzvUkGAc7Z.jpeg', 'youtube', NULL, 'Cotton, T-Shirt', 'Cotton Solid T-Shirt', 299.00, 299.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"38\"]}]', '[\"#696969\"]', NULL, 0, 1, 1, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Cotton Solid T-Shirt', 'Cotton Solid T-Shirt', 'uploads/products/meta/0sUJ4nmfrciwrlaVk23KHnT7U6Ur0u0gVslWUug7.jpeg', NULL, 'Cotton-Solid-T-Shirt-wL4sg', 0.00, NULL, 0, NULL, NULL, '2020-11-29 23:36:54', '2020-12-04 10:18:25'),
(57, 'Cotton Plain Shirt', 'seller', 34, 2, 4, 12, NULL, '[\"uploads\\/products\\/photos\\/ezWwjMzJyh5GamwOwUNWiuaWHjUKnt7c72JUsrX4.jpeg\"]', 'uploads/products/thumbnail/2NlLmcS3zTCviXjDBbRP5C8hYYp5H7Xwy4Gp0y8a.jpeg', 'youtube', NULL, 'Shirt, Plain', '<p>Cotton Plain Shirt</p><p>Full Sleeve</p>', 549.00, 549.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"38\"]}]', '[\"#000000\"]', NULL, 0, 1, 1, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Cotton Plain Shirt', 'Cotton Plain Shirt\r\nFull Sleeve', 'uploads/products/thumbnail/2NlLmcS3zTCviXjDBbRP5C8hYYp5H7Xwy4Gp0y8a.jpeg', NULL, 'Cotton-Plain-Shirt-s3uzr', 0.00, NULL, 0, NULL, NULL, '2020-11-29 23:41:33', '2020-12-04 10:18:24'),
(58, 'Kurtis', 'seller', 35, 1, 1, NULL, NULL, '[\"uploads\\/products\\/photos\\/J6kPPKSTinNuA419dRynM9up8hmGomYbCuBFkBW4.jpeg\",\"uploads\\/products\\/photos\\/C5sI4zpUf9LsaoYjyMPDr9NFzaeoyTzb8FNlXcDV.jpeg\"]', 'uploads/products/thumbnail/UYtYFAXVcLn7cAAqsHlMpbYMAtVMP6LytGmXw2Qv.jpeg', 'youtube', NULL, 'Chitrarekha Sensational Kurtis  Fabric: Rayon /cotton Kurtis', '<p><br></p><p><br></p>', 600.00, 600.00, 0, '[]', '[]', '[]', NULL, 1, 1, 1, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kurtis', 'Chitrarekha Sensational Kurtis\r\n\r\nFabric: Rayon / Cotton\r\nSleeve Length: Three-Quarter Sleeves\r\nPattern: Printed / Embroidered\r\nCombo of: Single\r\nSizes:\r\nXL (Bust Size: 42 in, Length Size: 48 in) \r\nL (Bust Size: 40 in, Length Size: 48 in) \r\nXXL (Bust Size: 44 in, Length Size: 48 in) \r\nXXXL (Bust Size: 46 in, Length Size: 48 in) \r\nM (Bust Size: 38 in, Length Size: 48 in) \r\nDispatch: 2-3 Days', 'uploads/products/thumbnail/UYtYFAXVcLn7cAAqsHlMpbYMAtVMP6LytGmXw2Qv.jpeg', NULL, 'Kurtis-xAnyp', 0.00, NULL, 0, NULL, NULL, '2020-11-30 11:49:30', '2020-12-03 23:11:37'),
(59, 'Reyon Kurtis', 'seller', 35, 1, 1, NULL, NULL, '[\"uploads\\/products\\/photos\\/Urg4hwRWvV9wFaDQAfQbzWGJQorA2QLkJ8c4cnON.jpeg\",\"uploads\\/products\\/photos\\/a8b03mlmpSu4u6OYhSVyrbxEvBgeQkWkqj40ob85.jpeg\",\"uploads\\/products\\/photos\\/oMPGYMDce1qvb2jkHT6PuxshiKF933GZJHSDNS4j.jpeg\",\"uploads\\/products\\/photos\\/yANS2w729HD3chKTUtbsEFMOffU7ATFLctRaGgTN.jpeg\",\"uploads\\/products\\/photos\\/LB26inXvGRwnk6nqLaPwGs1qpFBj0oXplwS0Oh73.jpeg\",\"uploads\\/products\\/photos\\/VIJ4vpv2GgGGleaDvBMKOQiz6ClSbGXy9VOkrZ6T.jpeg\",\"uploads\\/products\\/photos\\/pWTT739Ku4xCAWC4CdsZ1Ttez6BCoOtKJOsJMDBP.jpeg\",\"uploads\\/products\\/photos\\/HSNMGx2W8gsePACYCI2szbNIo7k4P85t4DJCu2N6.jpeg\"]', 'uploads/products/thumbnail/e4xJg9GQc6nCdtOeOAnt2Jidu2gvwVzjJgnLZBy2.jpeg', 'youtube', NULL, 'Banita Alluring Kurtis  Fabric: Rayon Sleeve Length: Sleeveless Pattern: Printed Combo of: Single Sizes: XL, L, M, XXL', NULL, 650.00, 0.00, 0, '[]', '[]', '[]', NULL, 0, 1, 1, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Reyon Kurtis', 'Banita Alluring Kurtis\r\n\r\nFabric: Rayon\r\nSleeve Length: Sleeveless\r\nPattern: Printed\r\nCombo of: Single\r\nSizes:\r\nXL, L, M, XXL\r\nDispatch: 2-3 Days\r\nCash on Delivery \r\nFree shipping', 'uploads/products/thumbnail/e4xJg9GQc6nCdtOeOAnt2Jidu2gvwVzjJgnLZBy2.jpeg', NULL, 'Reyon-Kurtis-9lq3s', 0.00, NULL, 0, NULL, NULL, '2020-11-30 15:59:01', '2020-12-04 10:14:29'),
(60, 'Oxidised silver Jwellary', 'seller', 35, 1, 2, 6, NULL, '[\"uploads\\/products\\/photos\\/6Oxxl3zRpDDFJ6V4UZFmvmZZ5drezw9JehLousdk.jpeg\",\"uploads\\/products\\/photos\\/Vhv9QsGl0E3KN60eDPVXE1bBYHd7RaD1pJVC3Qc5.jpeg\"]', 'uploads/products/thumbnail/24fqWFzJwssOxrxnjniVJxOUTyQuHrJVDsjqU33m.jpeg', 'youtube', NULL, 'Latest Women\'s Jewellery Sets', '<p>Base Metal: Alloy&nbsp;</p><p>plating : oxidised Silver&nbsp;</p><p>sizing: Adjustable&nbsp;</p><p>Description: 1 necklace and 1 Earrings&nbsp;</p>', 425.00, 0.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Oxidised silver Jwellary', 'Catalog Name:*Latest Women\'s Jewellery Sets*\r\nBase Metal: Alloy\r\nPlating: Oxidised Silver\r\nStone Type: Artificial Beads\r\nSizing: Adjustable\r\nType: Necklace and Earrings\r\nMultipack: 1\r\nDescription: 1 Necklace, 1 Pair Of Earrings\r\nDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any Issue\r\nCash on Delivery \r\nFree Shipping', 'uploads/products/thumbnail/24fqWFzJwssOxrxnjniVJxOUTyQuHrJVDsjqU33m.jpeg', NULL, 'Oxidised-silver-Jwellary-U8hiK', 0.00, NULL, 0, NULL, NULL, '2020-11-30 23:38:19', '2020-11-30 23:38:19'),
(61, 'Stylish beautiful Earrings', 'seller', 35, 1, 2, 6, NULL, '[\"uploads\\/products\\/photos\\/QsrRcSA8IRKd8mknMgFlT212lBjpUOC2aMynvZLk.jpeg\",\"uploads\\/products\\/photos\\/ZAw5OAonze5RabSjTNi48SAryBiBsaPrhlZdNOJX.jpeg\",\"uploads\\/products\\/photos\\/vIyQjc0N6LntX1yeqky2IJWJy5JYJmvPngRvJ4Od.jpeg\",\"uploads\\/products\\/photos\\/FwavEQeXTpuMwmskkWVMKVzduVoFZ7kWrMLnIdTM.jpeg\",\"uploads\\/products\\/photos\\/uC78QiSn6YxZHREyoYmUQs1yQHay1xaI7lFdMx6D.jpeg\",\"uploads\\/products\\/photos\\/sngU3xc1tMnmzlg02Ilk66hLzX5zqgnOIMuKrOG9.jpeg\",\"uploads\\/products\\/photos\\/am7AC34sTe0eUTRUCzjBGkqhVPGSciKBTRlUdPKR.jpeg\",\"uploads\\/products\\/photos\\/TdJqnu6lWjaQH2y8ai5xIulVFyJmmOacprdf9g5f.jpeg\",\"uploads\\/products\\/photos\\/z7K9jeVuRwUGO0qOmOt2NOfOhSU4xAhucZd4plOZ.jpeg\",\"uploads\\/products\\/photos\\/dYzMwquFxFYRkoLiYGEANGJSAmBdqXXsSFl9IE1F.jpeg\"]', NULL, 'youtube', NULL, 'Classy Attractive Stylish Earrings', 'Attractive Stylish women\'s Earrings&nbsp;', 390.00, 0.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Stylish beautiful Earrings', 'Base :Metal \r\nPlating: Gold plated \r\nType : Drop Earrings \r\nMultipack:1', NULL, NULL, 'Stylish-beautiful-Earrings-elOJh', 0.00, NULL, 0, NULL, NULL, '2020-11-30 23:49:11', '2020-11-30 23:49:11'),
(62, 'Jacquard buri Lengha', 'seller', 35, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/BWgUPv2TixWhtTbyiPRO2s8JQIzhTml0CoBQXkNy.jpeg\",\"uploads\\/products\\/photos\\/9HOXMu3111tkONl4GosMursJc8wvHAOCzNsqouA2.jpeg\",\"uploads\\/products\\/photos\\/QmR6fhuU2DmnoPS1BAPoqwGRS17fEfzz53LfRLXa.jpeg\",\"uploads\\/products\\/photos\\/SgGMmIKggQxiPHVTKMhJ94xwKwzZCdrNxJCPDk4D.jpeg\",\"uploads\\/products\\/photos\\/d0D6kRdj3rou2tvKlBJfC8Z4Mh3nYtOblJrmu3iL.jpeg\",\"uploads\\/products\\/photos\\/pzQdmJTgmNJ9ARJoLIWwDRoZ0a9QIo907qEBV3xW.jpeg\"]', 'uploads/products/thumbnail/jfC6rWWtnbk3ITeHWcGDqeI2kjbfG6Lwpb6Yz38h.jpeg', 'youtube', NULL, 'jacquard buti lengha choli with banarasi duppatta', 'Jacquard buti lengha choli with Banarasi Dupatta&nbsp;', 800.00, 0.00, 0, '[]', '[]', '[]', NULL, 0, 1, 1, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Jacquard buri Lengha', 'jacquard buti lengha choli with banarasi duppatta\r\nTopwear Fabric: Soft Silk\r\nBottomwear Fabric: Soft Silk\r\nDupatta Fabric: Soft Silk\r\nSet type: Choli And Dupatta\r\nTop Print or Pattern Type: Jacquard\r\nBottom Print or Pattern Type: Woven Design\r\nDupatta Print or Pattern Type: Jacquard\r\nSizes: \r\nSemi Stitched (Lehenga Waist Size: 40 in, Lehenga Length Size: 42 in, Duppatta Length Size: 2.2 m)', 'uploads/products/thumbnail/jfC6rWWtnbk3ITeHWcGDqeI2kjbfG6Lwpb6Yz38h.jpeg', NULL, 'Jacquard-buri-Lengha-GA0DI', 0.00, NULL, 0, NULL, NULL, '2020-12-01 00:04:04', '2020-12-04 10:14:26'),
(63, 'Kid\'s Girl\'s Lahenga Choli', 'seller', 35, 4, 11, NULL, NULL, '[\"uploads\\/products\\/photos\\/01VLL9T01fAHLF4l3XXboLeu9vItmoLs5R0sUoCD.jpeg\",\"uploads\\/products\\/photos\\/iQJj4ChHfvqyKDmBd6NNefXMiccBVwEO3nJc3OWA.jpeg\",\"uploads\\/products\\/photos\\/uTrrOkmaQ4vEkhLMOWZYHUQfO687MiWC0UZQX4Ux.jpeg\"]', 'uploads/products/thumbnail/NuNKNeKBXZScROf45O6hpIOwf08KGx1y5c6TAZ8w.jpeg', 'youtube', NULL, 'Pretty Kid\'s Girl\'s Lahenga choli', 'Pretty Kid\'s Girl\'s Mirror work Lehenga Choli', 650.00, 0.00, 0, '[]', '[]', '[]', NULL, 0, 1, 1, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kid\'s Girl\'s Lahenga Choli', 'Catalog Name : *Stunning Kid\'s Girl\'s Lehanga Choli\'s Vol 20*\r\n\r\nFabric: Cotton Silk\r\n\r\nSleeves: Sleeves Are Not Included\r\n\r\nSize: Age Group (2 - 3 Years) - 20 in\r\n\r\nAge Group (4 - 5 Years) - 24 in\r\n\r\nAge Group (6 - 7 Years) - 28 in\r\n\r\nAge Group (8 - 9 Years) - 30 in\r\n\r\nAge Group (10 - 11 Years) - 32 in\r\n\r\nAge Group (12 - 13 Years) - 34 in\r\n\r\nAge Group (13 - 14 Years) - 36 in\r\n\r\nType: Stitched\r\n\r\nDescription: It Has 1 Piece Of Kid\'s Girl\'s Lehanga & 1 Piece Of Girl\'s Choli\r\n\r\nWork: Mirror Work\r\n\r\n \r\n\r\nDesigns: 4\r\n\r\nEasy Returns Available In Case Of Any Issue\r\nCash on Delivery', 'uploads/products/thumbnail/NuNKNeKBXZScROf45O6hpIOwf08KGx1y5c6TAZ8w.jpeg', NULL, 'Kids-Girls-Lahenga-Choli-WJJok', 0.00, NULL, 0, NULL, NULL, '2020-12-01 00:23:59', '2020-12-04 10:14:31'),
(64, 'Jivika Modern  Women Gowns', 'seller', 35, 1, 1, 2, NULL, '[\"uploads\\/products\\/photos\\/2IhUKvP9u0xt8HTvIcAKfMju6cQCJHFkO6L0dL5V.jpeg\",\"uploads\\/products\\/photos\\/aaNiCh2JCHkIzrqg6dGSW9khvcCFPdYmf8PGiaEB.jpeg\",\"uploads\\/products\\/photos\\/8PDcF2G8URu2EYTPtKXvAL7aOBIhiH1zEEQ51MBf.jpeg\",\"uploads\\/products\\/photos\\/M9kaTYqNIuYxSZzn6isguind4ekiYLnFTEONjNy7.jpeg\",\"uploads\\/products\\/photos\\/7L1AYh3XSAHKySLhi2EFdyLO4SeeyqxvAlNeYLsk.jpeg\",\"uploads\\/products\\/photos\\/SMHU6gHkejt9yDLAsFmOJVxgOGj97WRR0pEhiIsD.jpeg\"]', 'uploads/products/thumbnail/8oPooQCFmoXoNSHVLSAGlyJAbY69WpgIxAxRuDo5.jpeg', 'youtube', NULL, 'Jivika Modern Women Gowns  Fabric: Heavy Rayon 14 Kg', 'Stylish Women\'s Gown&nbsp;', 650.00, 0.00, 0, '[]', '[]', '[]', NULL, 0, 1, 1, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Jivika Modern  Women Gowns', 'Catalog Name:*Jivika Modern Women Gowns*\r\n\r\nFabric: Heavy Rayon 14 Kg\r\nSleeve Length: Sleeveless\r\nPattern: Solid\r\nSet Type: Single piece\r\nStitch Type: Stitched\r\nMultipack: 1\r\n\"Sizes:\r\nS (Bust Size - 36 in , Length Size - 53 in)\r\nM (Bust Size - 38 in , Length Size - 53 in)\r\nL (Bust Size - 40 in , Length Size - 53 in)\r\nXL (Bust Size - 42 in , Length Size - 53 in)\r\nXXL (Bust Size - 44 in , Length Size - 53 in)\" \r\nColour: Variable (Message Us For Details)\r\n\r\nDispatch in  20 Days\r\nDesign: 4\r\nEasy Returns Available In Case Of Any Issue\r\nCash on Delivery', 'uploads/products/meta/UBFlrBRPrGgwZHyNq3VhmctQYjiNjkom6WGNKaIP.jpeg', NULL, 'Jivika-Modern--Women-Gowns-wrc4b', 0.00, NULL, 0, NULL, NULL, '2020-12-01 00:42:59', '2020-12-04 10:14:20'),
(65, 'Women Graceful Swetshirts', 'seller', 35, 1, 1, NULL, NULL, '[\"uploads\\/products\\/photos\\/mZQY5OgBFErDEMTAEYkXceSe4M9XM0CcJ4d2yEMr.jpeg\",\"uploads\\/products\\/photos\\/B8InBAOALaGjzLd0SZEc6AbEqaypJDrxLQnMtPNo.jpeg\",\"uploads\\/products\\/photos\\/HEeQfeiYbeOMS9vsOxPEqgYkycvd5HEJLo3LragK.jpeg\",\"uploads\\/products\\/photos\\/zrCzixSGrC0L3uR5JJXrQKMGjWhK2xpDEL5k4YcR.jpeg\",\"uploads\\/products\\/photos\\/JesP293v6LfdvJdBD8c2XLQ7eS05ZiSTLibcwwyY.jpeg\",\"uploads\\/products\\/photos\\/0y6eYYTbp1HV0Op1YGDXZpdqZiRgUr0bco934RGI.jpeg\"]', 'uploads/products/thumbnail/9PaFG4bRIZCWmCIyD34cvXaTrItLwSX60CHlxAlO.jpeg', 'youtube', NULL, 'Pretty Graceful Women Sweatshirts  Fabric: Cotton Blend', 'Pretty Graceful Women Sweatshirts&nbsp;', 675.00, 0.00, 0, '[]', '[]', '[]', NULL, 0, 1, 1, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Women Graceful Swetshirts', 'Catalog Name:*Pretty Graceful Women Sweatshirts*\r\nFabric: Cotton Blend\r\nSizes:\r\nS (Bust Size: 34 in, Length Size: 27 in) \r\nXL (Bust Size: 40 in, Length Size: 28 in) \r\nL (Bust Size: 38 in, Length Size: 27 in) \r\nM (Bust Size: 36 in, Length Size: 27 in) \r\n\r\nDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any Issue\r\nCash on Delivery', 'uploads/products/meta/Uuj5CXMQi6U18vld3jkRz7ka7jlLb4uLpYK2AASF.jpeg', NULL, 'Women-Graceful-Swetshirts-XY0p0', 0.00, NULL, 0, NULL, NULL, '2020-12-01 00:59:10', '2020-12-04 10:14:21'),
(66, 'Rayon Kurtis', 'seller', 35, 1, 1, 2, NULL, '[\"uploads\\/products\\/photos\\/7MfhRcH93TOtUvuqAPZehYvXgi2QvRj1x425arMz.jpeg\",\"uploads\\/products\\/photos\\/NDcrUSHum7O5u4OPngMAaHTVtb9WTcu8WDHUB967.jpeg\"]', 'uploads/products/thumbnail/yqYbA49M5zzvrEk5XxZWebiWtnzuoWiGtfCJACsO.jpeg', 'youtube', NULL, 'Aagyeyi Voguish Kurtis', 'Aagyeyi Voguish Rayon Kurtis', 800.00, 0.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"XL\",\"S\",\"M\",\"XXL\"]}]', '[]', NULL, 0, 1, 0, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Rayon Kurtis', 'Catalog Name:*Aagyeyi Voguish Kurtis*\r\nFabric: Rayon\r\nSleeve Length: Three-Quarter Sleeves\r\nPattern: Embroidered\r\nCombo of: Single\r\nSizes:\r\nXL (Bust Size: 42 in) \r\nL (Bust Size: 40 in) \r\nM (Bust Size: 38 in) \r\nXXL (Bust Size: 44 in) \r\n\r\nDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any Issue\r\nCash on Delivery', 'uploads/products/thumbnail/yqYbA49M5zzvrEk5XxZWebiWtnzuoWiGtfCJACsO.jpeg', NULL, 'Rayon-Kurtis-pUsMP', 0.00, NULL, 0, NULL, NULL, '2020-12-01 10:27:18', '2020-12-01 22:31:17'),
(67, 'Collection of Cake and chocolate mold', 'seller', 35, 3, 7, 19, NULL, '[\"uploads\\/products\\/photos\\/vicZghzMJnliHwXTTNzstu4U3bpodLYoiI7vorhY.jpeg\",\"uploads\\/products\\/photos\\/yzmWs1AuRBDlAa0i1KYnxXYzxpLo2jLTtsieeBuN.jpeg\"]', 'uploads/products/thumbnail/SgD6cvEXnUjEVqSwa3Js0ajvx4kfGdtIBIH3ldf3.jpeg', 'youtube', NULL, 'Silicone Mix Design Flower Chocolate Ice Candy Mould Combo Set', 'Silicone mix design&nbsp; Chocolate and ice candy mold', 390.00, 0.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Collection of Cake and chocolate mold', 'Silicone Mix Design Flower Chocolate Ice Candy Mould Combo Set, 2 Pieces\r\n\r\nLength : 28.0\r\n\r\nWidth : 28.0\r\n\r\nHeight : 6.5\r\n\r\nWithin 7-11 business days However, to find out an actual date of delivery, please enter your pin code.\r\n\r\nMade up of food grade high quality 100% Silicone Material. Non-toxic, odorless, tasteless, eco-friendly, reusable and durable. Assorted designs provides more baking options for all your favorite occasions. Hassle free chocolate baking is now easy with these non stick moulds. Unbreakable &amp; Easy to de-mould. Avoids breaking your chocolates. Ideal for making chocolates, ice-cubes etc Non-stick finish. Temperature range : -40 to +230 degree Celsius.', 'uploads/products/thumbnail/SgD6cvEXnUjEVqSwa3Js0ajvx4kfGdtIBIH3ldf3.jpeg', NULL, 'Collection-of-Cake-and-chocolate-mold-JsSXe', 0.00, NULL, 0, NULL, NULL, '2020-12-01 12:16:51', '2020-12-01 12:16:51'),
(68, 'Aagyeyi pretty Kurtis', 'seller', 35, 1, 1, 2, NULL, '[\"uploads\\/products\\/photos\\/ve9T9uKFNrW6KeVYBNAp4sTvkYnHdGpYU7VWa65Q.jpeg\",\"uploads\\/products\\/photos\\/60FYCVav07YZT51C7Jr60P7SwXpYKVG0FMWPqEWn.jpeg\",\"uploads\\/products\\/photos\\/PljoBTLTgnRbG8GMVQHuaWq0fgTfXtrxNkBdMRFH.jpeg\"]', 'uploads/products/thumbnail/9hLeaK4hSoUizNgcVmXyqmLN1dOTRlZghZgCDbPM.jpeg', 'youtube', NULL, 'Aagyeyi Pretty Women Kurta Sets', 'Charbi Fashionable Kurta set', 1975.00, 0.00, 0, '[]', '[]', '[]', NULL, 0, 1, 1, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Aagyeyi pretty Kurtis', 'Catalog Name:*Aagyeyi Pretty Women Kurta Sets*\r\nKurta Fabric: Cotton\r\nBottomwear Fabric: Cotton\r\nFabric: Cotton\r\nSleeve Length: Long Sleeves\r\nSet Type: Kurta With Bottomwear\r\nBottom Type: Palazzos\r\nPattern: Printed\r\nMultipack: Single\r\nSizes: \r\nXL, L, M, XXLDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any Issue\r\nCash on Delivery', 'uploads/products/thumbnail/9hLeaK4hSoUizNgcVmXyqmLN1dOTRlZghZgCDbPM.jpeg', NULL, 'Aagyeyi-pretty-Kurtis-gV0Ic', 0.00, NULL, 0, NULL, NULL, '2020-12-01 12:47:05', '2020-12-04 10:14:16'),
(69, 'Rayon Kurtis', 'seller', 35, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/tZA3KExMBJRukWMNNbx2VJJkYtY8zrHsNDM0SWKl.jpeg\",\"uploads\\/products\\/photos\\/ZIV4eHT6XMbwTErg88a1XdRZy85Wn2CB8yH2qg5i.jpeg\"]', 'uploads/products/thumbnail/idaVg4HBBbRVDKlD18qgFJdxpxc2X0ZRYDUTO1Dv.jpeg', 'youtube', NULL, 'Women\'s Rayon Kurta with Skirts', 'Trendy Women Kurti with Skirt', 900.00, 900.00, 0, '[]', '[]', '[]', NULL, 0, 1, 1, 3, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Rayon Kurtis', 'Catalog Name:*Aagyeyi Drishya Women Kurtis*\r\nKurta Fabric: Rayon\r\nSleeve Length: Three-Quarter Sleeves\r\nPattern: Printed\r\nMultipack: Single\r\nSizes: \r\nXL (Bust Size: 42 in, Kurta Length Size: 52 in) \r\nL (Bust Size: 40 in, Kurta Length Size: 52 in) \r\nM (Bust Size: 38 in, Kurta Length Size: 52 in) \r\nS (Bust Size: 36 in, Kurta Length Size: 52 in) \r\nXXL (Bust Size: 44 in, Kurta Length Size: 52 in)\r\nDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any Issue\r\n*Proof of Safe Delivery! Click to know on Safety Standards of Delivery Partners- https://bit.ly/30lPKZF', 'uploads/products/meta/qe3Hqf1PzbgnDKknXWTm7KnlVWfcGZGUVVRZagrz.jpeg', NULL, 'Rayon-Kurtis-k3JnT', 0.00, NULL, 0, NULL, NULL, '2020-12-01 22:21:11', '2020-12-04 10:14:13'),
(70, 'Graceful pendants and Lockets', 'seller', 35, 1, 2, 6, NULL, '[\"uploads\\/products\\/photos\\/qvnl48Koobjmgv11jaH7XeVvAn0GyQpQXubxQu8c.jpeg\",\"uploads\\/products\\/photos\\/iztEaCGgifDuobhTB4USghwmJBzIh55v5eqx6gRy.jpeg\",\"uploads\\/products\\/photos\\/8ZYxvnznLVG4wazzJmz0gaaAtIyzXSydzI2Nkvph.jpeg\",\"uploads\\/products\\/photos\\/XljdQ6qB6NYtUV0git7YDq6Ep8mPuVQsJg79ANdg.jpeg\",\"uploads\\/products\\/photos\\/xod3nUiIwCquugDrrEyqfdifkctwGXVbQqtduUmB.jpeg\",\"uploads\\/products\\/photos\\/Ba1ECAewikUZReDS5dh9oNKGbCQD8kBx8HTvZIVo.jpeg\"]', 'uploads/products/thumbnail/ov2zriz1CL0BEU38hpa51PBbRC95ntwfjDWl7rds.jpeg', 'youtube', NULL, 'Allure Graceful Pendants & Lockets', 'Ethnic look Pandant set with chain and one pair of Earrings&nbsp;', 799.00, 799.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 6, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Ethnic Pendant and Lockets', 'Catalog Name:*Allure Graceful Pendants & Lockets*\r\nBase Metal: Meta\r\nPlating: Gold Plated - Matte\r\nStone Type: Emerald\r\nType: Pendant with Chain\r\nMultipack: 1\r\nSizes: Free Size\r\nDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any Issue\r\n*Proof of Safe Delivery! Click to know on Safety Standards of Delivery Partners- https://bit.ly/30lPKZF', 'uploads/products/meta/o387VnKEMhUotkUrL7pETLduAF3hJfvjPWtov9vt.jpeg', NULL, 'Graceful-pendants-and-Lockets-W5eny', 0.00, NULL, 0, NULL, NULL, '2020-12-01 23:01:44', '2020-12-03 23:09:38'),
(71, 'Maharashtrian Traditional Mangalsutra', 'seller', 35, 1, 2, 6, NULL, '[\"uploads\\/products\\/photos\\/URW9DCJoJrP1MseEQdUNgXhxK5snKEdgD9OpYSVz.jpeg\",\"uploads\\/products\\/photos\\/Aij4oECENtB7OCnc1jNM3JzbHtLDyKqBZysng1xp.jpeg\",\"uploads\\/products\\/photos\\/Y2myxH5csiTz0N0HRZs14v1QkqTqoWw9b5jPzHo6.jpeg\",\"uploads\\/products\\/photos\\/LZHrHdHvmTtvlSskhkhnrlpztAge1gsMKl9mwseM.jpeg\",\"uploads\\/products\\/photos\\/qmb0pWYv6EldvOkcQgzNjMVuM2ctklOVjzXCSQQU.jpeg\",\"uploads\\/products\\/photos\\/2rsjBP2dWxVFfozuuWt6jnVgVyu0ZV8q3ztQwXmY.jpeg\",\"uploads\\/products\\/photos\\/nsk3Pymiz4v5gBqOTt2k3DwuA1ireuFnMd9A22v3.jpeg\"]', 'uploads/products/thumbnail/cL7LZPJclOdyInAih3tRb3iy1FZ8s7fnVqKxCFzA.jpeg', 'youtube', NULL, 'Allure Beautiful Mangalsutras', 'Maharashtrian Traditional Nath Mangalsutra', 432.00, 432.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 4, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Maharashtrian Traditional Mangalsutra', 'Catalog Name:*Allure Beautiful Mangalsutras*\r\nBase Metal: Brass & Copper\r\nPlating: Gold Plated\r\nStone Type: Artificial Stones & Beads\r\nSizing: Adjustable\r\nType: Mangalsutra Set\r\nMultipack: 1\r\nSizes:Free Size (Length Size: 24 in)\r\nDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any Issue\r\n*Proof of Safe Delivery! Click to know on Safety Standards of Delivery Partners- https://bit.ly/30lPKZF', 'uploads/products/thumbnail/cL7LZPJclOdyInAih3tRb3iy1FZ8s7fnVqKxCFzA.jpeg', NULL, 'Maharashtrian-Traditional-Mangalsutra-fTCug', 0.00, NULL, 0, NULL, NULL, '2020-12-02 13:01:44', '2020-12-03 23:08:12'),
(72, 'Boys Solid / Printed / Sttiped T-Shirts', 'seller', 34, 4, 11, NULL, NULL, '[\"uploads\\/products\\/photos\\/rivBzPP3D8elhPPMSFjhqoyv9zmvZIfdVbpCbdS0.jpeg\",\"uploads\\/products\\/photos\\/gn24aSYOR0XHVbNV98HSFDVenhKMsKfrRHOQe9cx.jpeg\",\"uploads\\/products\\/photos\\/EHtyKIcfSvVggKkLvfEVrV5dg7oVjvbpZWzntaLb.jpeg\"]', 'uploads/products/thumbnail/QYHjM8YlTl6FZompx4d4NwkLGF6LlEQlZXew9j5u.jpeg', 'youtube', NULL, 'Solid, Striped,Printed, T-Shirt', 'Description : It Has 1 Piece of T-Shirt\r\n\r\nAge : 4-5 Years, 5-6 Years, 6-7 Years, 7-8 Years, 8-9 Years, 9-10 Years, 10-11 Years, 11-12 Years\r\n\r\nMaterial : Cotton\r\n\r\nWork : Solid/Printed/Striped\r\n\r\nDesigns: 2\r\n\r\nFREE Shipping\r\nFREE COD\r\nFREE Return &amp; 100% Refund\r\nDelivery: Within 7 days', 441.00, 441.00, 1, '[\"2\"]', '[{\"attribute_id\":\"2\",\"values\":[\"Cotton\"]}]', '[\"#FF0000\"]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Solid , Printed , Striped, Tshirt', 'Description : It Has 1 Piece of T-Shirt\r\n\r\nAge : 4-5 Years, 5-6 Years, 6-7 Years, 7-8 Years, 8-9 Years, 9-10 Years, 10-11 Years, 11-12 Years\r\n\r\nMaterial : Cotton\r\n\r\nWork : Solid/Printed/Striped\r\n\r\nDesigns: 2\r\n\r\nFREE Shipping\r\nFREE COD\r\nFREE Return & 100% Refund\r\nDelivery: Within 7 days', 'uploads/products/meta/xfNAVHTfHJ9HDiRSbYWWokT8VvRfj0DCw4GGEW26.jpeg', NULL, 'Boys-Solid--Printed--Sttiped-T-Shirts-fC2wX', 0.00, NULL, 0, NULL, NULL, '2020-12-02 17:29:35', '2020-12-02 17:29:35'),
(73, 'Boys Solid T-Shirts', 'seller', 34, 4, 11, NULL, NULL, '[\"uploads\\/products\\/photos\\/33gHMsymO302srS97Mr7LSTPUB7nHOxKL4VwoD6y.jpeg\",\"uploads\\/products\\/photos\\/LePnCh1oqsLoaqLJ7qrVgEmh2K457FXn6ZzQwmQL.jpeg\",\"uploads\\/products\\/photos\\/1i3RLXQEzKEkqHDDurfIHvEiwPlu1KQFr4Fefhi8.jpeg\"]', 'uploads/products/thumbnail/MhkJSocQjzkLZAYAlXxll5pGwvla43LyytchDzml.jpeg', 'youtube', NULL, 'T-Shirt, Solid, Boys', 'Description : It Has 1 Piece of T-Shirt\r\nAge : 4-5 Years, 5-6 Years, 6-7 Years, 7-8 Years, 8-9 Years, 9-10 Years, 10-11 Years, 11-12 Years\r\nMaterial : Cotton\r\nWork : Solid\r\n\r\nFREE Shipping\r\nFREE COD\r\nFREE Return &amp; 100% Refund\r\nDelivery: Within 7 days', 441.00, 441.00, 1, '[\"2\"]', '[{\"attribute_id\":\"2\",\"values\":[\"Cotton\"]}]', '[\"#FFFF00\"]', NULL, 0, 1, 1, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Solid ,  Tshirt', 'Description : It Has 1 Piece of T-Shirt\r\nAge : 4-5 Years, 5-6 Years, 6-7 Years, 7-8 Years, 8-9 Years, 9-10 Years, 10-11 Years, 11-12 Years\r\nMaterial : Cotton\r\nWork : Solid\r\n\r\nFREE Shipping\r\nFREE COD\r\nFREE Return & 100% Refund\r\nDelivery: Within 7 days', 'uploads/products/meta/3yMvGUplrjsmuQUsZk9fZtpjlqNiaIRpxN3GjAX8.jpeg', NULL, 'Boys-Solid-T-Shirts-AmSot', 0.00, NULL, 0, NULL, NULL, '2020-12-02 17:37:19', '2020-12-04 10:18:20');
INSERT INTO `products` (`id`, `name`, `added_by`, `user_id`, `category_id`, `subcategory_id`, `subsubcategory_id`, `brand_id`, `photos`, `thumbnail_img`, `video_provider`, `video_link`, `tags`, `description`, `unit_price`, `purchase_price`, `variant_product`, `attributes`, `choice_options`, `colors`, `variations`, `todays_deal`, `published`, `featured`, `current_stock`, `unit`, `min_qty`, `discount`, `discount_type`, `tax`, `tax_type`, `shipping_type`, `shipping_cost`, `num_of_sale`, `meta_title`, `meta_description`, `meta_img`, `pdf`, `slug`, `rating`, `barcode`, `digital`, `file_name`, `file_path`, `created_at`, `updated_at`) VALUES
(74, 'Boys Stylish Striped T-Shirts', 'seller', 34, 4, 11, NULL, NULL, '[\"uploads\\/products\\/photos\\/vNkh5MJqYPAbqhJQDcRZkB1u9hTR2KMcBsVo4VHW.jpeg\"]', 'uploads/products/thumbnail/LgEauMDI5ftLFJDuAET5OC2QESxodX6V0wyOge8H.jpeg', 'youtube', NULL, 'Striped, T-Shirts, Boys', 'Description : It has 1 piece of T-Shirt\r\nAge : 1 - 2 Years, 2 - 3 Years,  3 - 4 Years, 5 - 6 Years,  7 - 8 Years, 9 - 10 Years, 11 - 12 Years, 13 - 14 Years\r\nMaterial : Cotton\r\nSize (in Inches): (1 - 2 Years) 20, (2 - 3 Years) 22, (3 - 4 Years) 24, (5 - 6 Years) 26, (7 - 8 Years) 28,  (9 - 10 Years) 30, (11 - 12 Years) 32, (13 - 14 Years ) 34\r\nLength (In Inches):(1 - 2 Years) 16, (2 - 3 Years) 17, (3 - 4 Years) 18.5, (5 - 6 Years) 19.5, (7 - 8 Years) 20.5,  (9 - 10 Years) 22, (11 - 12 Years) 23, (13 - 14 Years ) 24\r\nWork : Striped \r\n\r\n\r\n\r\nFREE Shipping \r\nFREE COD\r\nFREE Return &amp; 100% Refund\r\nDelivery: Within 6 days', 416.00, 416.00, 1, '[\"2\"]', '[{\"attribute_id\":\"2\",\"values\":[\"Cotton\"]}]', '[]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Boys Stylish Striped T-Shirt', 'Description : It has 1 piece of T-Shirt\r\nAge : 1 - 2 Years, 2 - 3 Years,  3 - 4 Years, 5 - 6 Years,  7 - 8 Years, 9 - 10 Years, 11 - 12 Years, 13 - 14 Years\r\nMaterial : Cotton\r\nSize (in Inches): (1 - 2 Years) 20, (2 - 3 Years) 22, (3 - 4 Years) 24, (5 - 6 Years) 26, (7 - 8 Years) 28,  (9 - 10 Years) 30, (11 - 12 Years) 32, (13 - 14 Years ) 34\r\nLength (In Inches):(1 - 2 Years) 16, (2 - 3 Years) 17, (3 - 4 Years) 18.5, (5 - 6 Years) 19.5, (7 - 8 Years) 20.5,  (9 - 10 Years) 22, (11 - 12 Years) 23, (13 - 14 Years ) 24\r\nWork : Striped \r\n\r\n\r\n\r\nFREE Shipping \r\nFREE COD\r\nFREE Return & 100% Refund\r\nDelivery: Within 6 days', 'uploads/products/meta/bru7q2onSYdvrdvWQ5QvLCkucTo3QXg0TUuZ7VcB.jpeg', NULL, 'Boys-Stylish-Striped-T-Shirts-fT7Rh', 0.00, NULL, 0, NULL, NULL, '2020-12-02 17:41:50', '2020-12-02 17:41:50'),
(75, 'Boys Stylish Striped T-Shirts', 'seller', 34, 4, 11, NULL, NULL, '[\"uploads\\/products\\/photos\\/q4dkVf4gDdEjDlDwQKbnXTV8mtZ9RbnF0aQGbQWr.jpeg\"]', 'uploads/products/thumbnail/MwOtWll0DUMJmApCNx7zOGFcuL9X5ef6xdt22Cz4.jpeg', 'youtube', NULL, 'Stylish, Striped, T-Shirt', 'Description : It has 1 piece of T-Shirt\r\nAge : 1 - 2 Years, 2 - 3 Years,  3 - 4 Years, 5 - 6 Years,  7 - 8 Years, 9 - 10 Years, 11 - 12 Years, 13 - 14 Years\r\nMaterial : Cotton\r\nSize (in Inches): (1 - 2 Years) 20, (2 - 3 Years) 22, (3 - 4 Years) 24, (5 - 6 Years) 26, (7 - 8 Years) 28,  (9 - 10 Years) 30, (11 - 12 Years) 32, (13 - 14 Years ) 34\r\nLength (In Inches):(1 - 2 Years) 16, (2 - 3 Years) 17, (3 - 4 Years) 18.5, (5 - 6 Years) 19.5, (7 - 8 Years) 20.5,  (9 - 10 Years) 22, (11 - 12 Years) 23, (13 - 14 Years ) 24\r\nWork : Striped \r\n\r\n\r\n\r\nFREE Shipping\r\nFREE COD \r\nFREE Return &amp; 100% Refund\r\nDelivery: Within 6 days', 416.00, 416.00, 1, '[\"2\"]', '[{\"attribute_id\":\"2\",\"values\":[\"Cotton\"]}]', '[]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Solid ,  Tshirt, Striped', 'Description : It has 1 piece of T-Shirt\r\nAge : 1 - 2 Years, 2 - 3 Years,  3 - 4 Years, 5 - 6 Years,  7 - 8 Years, 9 - 10 Years, 11 - 12 Years, 13 - 14 Years\r\nMaterial : Cotton\r\nSize (in Inches): (1 - 2 Years) 20, (2 - 3 Years) 22, (3 - 4 Years) 24, (5 - 6 Years) 26, (7 - 8 Years) 28,  (9 - 10 Years) 30, (11 - 12 Years) 32, (13 - 14 Years ) 34\r\nLength (In Inches):(1 - 2 Years) 16, (2 - 3 Years) 17, (3 - 4 Years) 18.5, (5 - 6 Years) 19.5, (7 - 8 Years) 20.5,  (9 - 10 Years) 22, (11 - 12 Years) 23, (13 - 14 Years ) 24\r\nWork : Striped \r\n\r\n\r\n\r\nFREE Shipping\r\nFREE COD \r\nFREE Return & 100% Refund\r\nDelivery: Within 6 days', 'uploads/products/meta/NgJKg8b2egPOLn47Ky3qKrUpMxnvImIQhBRskXaw.jpeg', NULL, 'Boys-Stylish-Striped-T-Shirts-icYKZ', 0.00, NULL, 0, NULL, NULL, '2020-12-02 17:45:33', '2020-12-02 17:45:33'),
(76, 'Boys Stylish Striped T-Shirts', 'seller', 34, 4, 11, NULL, NULL, '[\"uploads\\/products\\/photos\\/R9fr75XfPflJow5W84McYYJiq60sIqHT3sFsPH6t.jpeg\"]', 'uploads/products/thumbnail/uDwmicbarjztn3Y25KPulZ9TVWjmElvfcwHnaPRJ.jpeg', 'youtube', NULL, 'Stylish, Striped, Tshirts', '<p>Description : It has 1 piece of T-Shirt\r\nAge : 1 - 2 Years, 2 - 3 Years,  3 - 4 Years, 5 - 6 Years,  7 - 8 Years, 9 - 10 Years, 11 - 12 Years, 13 - 14 Years\r\nMaterial : Cotton\r\nSize (in Inches): (1 - 2 Years) 20, (2 - 3 Years) 22, (3 - 4 Years) 24, (5 - 6 Years) 26, (7 - 8 Years) 28,  (9 - 10 Years) 30, (11 - 12 Years) 32, (13 - 14 Years ) 34\r\nLength (In Inches):(1 - 2 Years) 16, (2 - 3 Years) 17, (3 - 4 Years) 18.5, (5 - 6 Years) 19.5, (7 - 8 Years) 20.5,  (9 - 10 Years) 22, (11 - 12 Years) 23, (13 - 14 Years ) 24\r\nWork : Striped \r\n\r\n\r\n\r\nFREE Shipping\r\nFREE COD \r\nFREE Return &amp; 100% Refund\r\nDelivery: Within 6 days<br></p>', 416.00, 416.00, 1, '[\"2\"]', '[{\"attribute_id\":\"2\",\"values\":[\"Cotton\"]}]', '[]', NULL, 0, 1, 1, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Solid ,  Tshirt, Striped', 'Description : It has 1 piece of T-Shirt\r\nAge : 1 - 2 Years, 2 - 3 Years,  3 - 4 Years, 5 - 6 Years,  7 - 8 Years, 9 - 10 Years, 11 - 12 Years, 13 - 14 Years\r\nMaterial : Cotton\r\nSize (in Inches): (1 - 2 Years) 20, (2 - 3 Years) 22, (3 - 4 Years) 24, (5 - 6 Years) 26, (7 - 8 Years) 28,  (9 - 10 Years) 30, (11 - 12 Years) 32, (13 - 14 Years ) 34\r\nLength (In Inches):(1 - 2 Years) 16, (2 - 3 Years) 17, (3 - 4 Years) 18.5, (5 - 6 Years) 19.5, (7 - 8 Years) 20.5,  (9 - 10 Years) 22, (11 - 12 Years) 23, (13 - 14 Years ) 24\r\nWork : Striped \r\n\r\n\r\n\r\nFREE Shipping\r\nFREE COD \r\nFREE Return & 100% Refund\r\nDelivery: Within 6 days', 'uploads/products/meta/Q1zObru60lQfeiICcN5Ijq3wrrw7j7StjqV8qByK.jpeg', NULL, 'Boys-Stylish-Striped-T-Shirts-VMRVJ', 0.00, NULL, 0, NULL, NULL, '2020-12-02 17:47:54', '2020-12-04 10:18:19'),
(77, 'Boys Stylish Striped T-Shirts', 'seller', 34, 4, 11, NULL, NULL, '[\"uploads\\/products\\/photos\\/3IOs3ER0ikdf9vwlghwlZZzHu0BCzdu8p4hxW6rk.jpeg\"]', 'uploads/products/thumbnail/ChWdKBQkOsomVbe3V3mdedIOUwC9pkVsHE6lvrng.jpeg', 'youtube', NULL, 'Stylish, Striped, Tshirts', 'Description : It has 1 piece of T-Shirt\r\nAge : 1 - 2 Years, 2 - 3 Years,  3 - 4 Years, 5 - 6 Years,  7 - 8 Years, 9 - 10 Years, 11 - 12 Years, 13 - 14 Years\r\nMaterial : Cotton\r\nSize (in Inches): (1 - 2 Years) 20, (2 - 3 Years) 22, (3 - 4 Years) 24, (5 - 6 Years) 26, (7 - 8 Years) 28,  (9 - 10 Years) 30, (11 - 12 Years) 32, (13 - 14 Years ) 34\r\nLength (In Inches):(1 - 2 Years) 16, (2 - 3 Years) 17, (3 - 4 Years) 18.5, (5 - 6 Years) 19.5, (7 - 8 Years) 20.5,  (9 - 10 Years) 22, (11 - 12 Years) 23, (13 - 14 Years ) 24\r\nWork : Striped \r\n\r\n\r\n\r\nFREE Shipping\r\nFREE COD \r\nFREE Return &amp; 100% Refund\r\nDelivery: Within 6 days', 416.00, 416.00, 1, '[\"2\"]', '[{\"attribute_id\":\"2\",\"values\":[\"Cotton\"]}]', '[]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Solid ,  Tshirt, Striped', 'Description : It has 1 piece of T-Shirt\r\nAge : 1 - 2 Years, 2 - 3 Years,  3 - 4 Years, 5 - 6 Years,  7 - 8 Years, 9 - 10 Years, 11 - 12 Years, 13 - 14 Years\r\nMaterial : Cotton\r\nSize (in Inches): (1 - 2 Years) 20, (2 - 3 Years) 22, (3 - 4 Years) 24, (5 - 6 Years) 26, (7 - 8 Years) 28,  (9 - 10 Years) 30, (11 - 12 Years) 32, (13 - 14 Years ) 34\r\nLength (In Inches):(1 - 2 Years) 16, (2 - 3 Years) 17, (3 - 4 Years) 18.5, (5 - 6 Years) 19.5, (7 - 8 Years) 20.5,  (9 - 10 Years) 22, (11 - 12 Years) 23, (13 - 14 Years ) 24\r\nWork : Striped \r\n\r\n\r\n\r\nFREE Shipping\r\nFREE COD \r\nFREE Return & 100% Refund\r\nDelivery: Within 6 days', 'uploads/products/meta/PkNevfxiLRP7j5lVbmjcukkTQSPSfiaNcOETnS9V.jpeg', NULL, 'Boys-Stylish-Striped-T-Shirts-vaF99', 0.00, NULL, 0, NULL, NULL, '2020-12-02 17:49:20', '2020-12-02 17:49:20'),
(78, 'Boys Stylish Striped T-Shirts', 'seller', 34, 4, 11, NULL, NULL, '[\"uploads\\/products\\/photos\\/GMl4MQ8tDe18jZgGTCNspaqJYUqN5fhsG8FFjRJB.jpeg\"]', 'uploads/products/thumbnail/H9xLV3C7nM8HeHBZtyN9bgZHa56JtUFP53bi6Ti9.jpeg', 'youtube', NULL, 'Stylish, Striped, Tshirts', 'Description : It has 1 piece of T-Shirt\r\nAge : 1 - 2 Years, 2 - 3 Years,  3 - 4 Years, 5 - 6 Years,  7 - 8 Years, 9 - 10 Years, 11 - 12 Years, 13 - 14 Years\r\nMaterial : Cotton\r\nSize (in Inches): (1 - 2 Years) 20, (2 - 3 Years) 22, (3 - 4 Years) 24, (5 - 6 Years) 26, (7 - 8 Years) 28,  (9 - 10 Years) 30, (11 - 12 Years) 32, (13 - 14 Years ) 34\r\nLength (In Inches):(1 - 2 Years) 16, (2 - 3 Years) 17, (3 - 4 Years) 18.5, (5 - 6 Years) 19.5, (7 - 8 Years) 20.5,  (9 - 10 Years) 22, (11 - 12 Years) 23, (13 - 14 Years ) 24\r\nWork : Striped \r\n\r\n\r\n\r\nFREE Shipping\r\nFREE COD \r\nFREE Return &amp; 100% Refund\r\nDelivery: Within 6 days', 416.00, 416.00, 1, '[\"2\"]', '[{\"attribute_id\":\"2\",\"values\":[\"Cotton\"]}]', '[]', NULL, 0, 1, 1, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Solid ,  Tshirt, Striped', 'Description : It has 1 piece of T-Shirt\r\nAge : 1 - 2 Years, 2 - 3 Years,  3 - 4 Years, 5 - 6 Years,  7 - 8 Years, 9 - 10 Years, 11 - 12 Years, 13 - 14 Years\r\nMaterial : Cotton\r\nSize (in Inches): (1 - 2 Years) 20, (2 - 3 Years) 22, (3 - 4 Years) 24, (5 - 6 Years) 26, (7 - 8 Years) 28,  (9 - 10 Years) 30, (11 - 12 Years) 32, (13 - 14 Years ) 34\r\nLength (In Inches):(1 - 2 Years) 16, (2 - 3 Years) 17, (3 - 4 Years) 18.5, (5 - 6 Years) 19.5, (7 - 8 Years) 20.5,  (9 - 10 Years) 22, (11 - 12 Years) 23, (13 - 14 Years ) 24\r\nWork : Striped \r\n\r\n\r\n\r\nFREE Shipping\r\nFREE COD \r\nFREE Return & 100% Refund\r\nDelivery: Within 6 days', 'uploads/products/meta/nWb15CxW9gdQ4ddyoXrFLtdpxoGiAD06QXn3d7X1.jpeg', NULL, 'Boys-Stylish-Striped-T-Shirts-DkRGK', 0.00, NULL, 0, NULL, NULL, '2020-12-02 17:50:56', '2020-12-04 10:18:14'),
(79, 'Kids Printed Costume Wear', 'seller', 34, 4, 11, NULL, NULL, '[\"uploads\\/products\\/photos\\/j2LgsMi1tNMmVp7WaAKoWVqS6Qzgn7mVp1xy0BNR.jpeg\",\"uploads\\/products\\/photos\\/hNuk6mb9c3JgQiKmk63yMtIEOjc8pyyWb5bkgCPc.jpeg\",\"uploads\\/products\\/photos\\/XNORDrkf7aikimXwQyK2EQdtBAeMEpfjXfhBVbCl.jpeg\",\"uploads\\/products\\/photos\\/2cissGlYocxc5YNKUup0u9DayOGFtNRy0FOHNvrv.jpeg\",\"uploads\\/products\\/photos\\/aRu2VvYXqr0OvDMPOvFDVGyzRM334exT77DjuQEX.jpeg\",\"uploads\\/products\\/photos\\/Fc8b53JqfaGLobYjbDt76ZvpPn0XWHGGFef9YS6Z.jpeg\"]', 'uploads/products/thumbnail/6DtyA8XSYwL2HwHSQotU4BcGLoZ18r8qApMrI6Q8.jpeg', 'youtube', NULL, 'Kids, Printed, Costume Wear', 'Description: It Has 1 Piece of Costume Wear\r\nAge: 2-4 Years, 4-6 Years, 6-8 Years, 2-3 Years, 3-4 Years, 4-5 Years, 5-6 Years, 6-7 Years, 7-8 Years\r\nMaterial: Polycotton\r\nWork: Printed\r\nSize (L X W X H in CMs): 20 x 20 x 4\r\nWeight: 320 Gms\r\nCountry of Origin: India\r\nDesigns: 6\r\n\r\nFREE Shipping \r\nFREE COD\r\nFREE Return &amp; 100% Refund\r\nDelivery: Within 7 days', 899.00, 899.00, 1, '[\"2\"]', '[{\"attribute_id\":\"2\",\"values\":[\"Polycotton\"]}]', '[]', NULL, 0, 1, 1, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Costume Wear', 'Description: It Has 1 Piece of Costume Wear\r\nAge: 2-4 Years, 4-6 Years, 6-8 Years, 2-3 Years, 3-4 Years, 4-5 Years, 5-6 Years, 6-7 Years, 7-8 Years\r\nMaterial: Polycotton\r\nWork: Printed\r\nSize (L X W X H in CMs): 20 x 20 x 4\r\nWeight: 320 Gms\r\nCountry of Origin: India\r\nDesigns: 6\r\n\r\nFREE Shipping \r\nFREE COD\r\nFREE Return & 100% Refund\r\nDelivery: Within 7 days', 'uploads/products/meta/a8PX3bOZZgyMKAHDpF0Pc8Zn5AGYO8Zu2NrDXMS3.jpeg', NULL, 'Kids-Printed-Costume-Wear-AitZZ', 0.00, NULL, 0, NULL, NULL, '2020-12-02 18:38:34', '2020-12-04 10:18:16'),
(80, 'Cotton Sarees', 'seller', 35, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/JkOHU7OiLcxSiY6m45K0LBHprkryWgn2LdenkLmg.jpeg\",\"uploads\\/products\\/photos\\/E0zMW1g9OUUZt69bjf7TRlqoYsuLDdj4f6fngoyv.jpeg\",\"uploads\\/products\\/photos\\/ZvzKMOovEEk00jFrtKMmDogoAb2puKaugABMehNl.jpeg\",\"uploads\\/products\\/photos\\/zySHgsVwFHCyVnboyOC9BmRgjGzPwXbygyJjlalm.jpeg\",\"uploads\\/products\\/photos\\/TLz8lON1Zi9ux3TaTjoqwyjCyVeubaj0KRjsZRGr.jpeg\",\"uploads\\/products\\/photos\\/MoOGoXsAxq4JpzroSCigJb8mpGUH7sSHH15S5Gex.jpeg\",\"uploads\\/products\\/photos\\/3QdxzGTywe8jv5R6O7U5576YpW9NtjioBBB6eWMH.jpeg\",\"uploads\\/products\\/photos\\/kEwKd6RYHTfZZyyu1CT7ZuPvw6wrwexCd5Hjpi7X.jpeg\",\"uploads\\/products\\/photos\\/UoL4mfbDDq9uwN2lhqYAfhvwRfyIo7J5nAP9Cyyg.jpeg\"]', 'uploads/products/thumbnail/lty4jXiREhPeR7bF8oAiewsrzPA72YVijB5YOuSr.jpeg', 'youtube', NULL, 'JBeautiful Kota Cotton Sarees', 'Beautiful kota Cotton Sarees&nbsp;', 750.00, 750.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 10, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kota Cotton Sarees', 'Catalog Name: *Beautiful  Kota Cotton Sarees*\r\n\r\nFabric: Saree - Kota Cotton , Blouse - Kota Cotton\r\n\r\nSize: Saree Length With Running Blouse - 6.3 Mtr\r\n\r\nWork: Zari\r\n\r\n \r\n\r\nDesign : 10\r\n\r\nEasy Returns Available In Case Of Any Issue\r\nCash on Delivery', 'uploads/products/thumbnail/lty4jXiREhPeR7bF8oAiewsrzPA72YVijB5YOuSr.jpeg', NULL, 'Cotton-Sarees-kJPSR', 0.00, NULL, 0, NULL, NULL, '2020-12-02 23:00:14', '2020-12-03 23:07:31'),
(81, 'Fusion Jwellary set', 'seller', 35, 1, 2, 6, 2, '[\"uploads\\/products\\/photos\\/5RP8mJfKT3n7X82Na70H8kdqpekUxZpHaLs1bRB7.jpeg\",\"uploads\\/products\\/photos\\/7UvmsT19rLk2coZZV4iuadn1Ppjujam8UkzAFK1W.jpeg\",\"uploads\\/products\\/photos\\/lDy0Gyrb7ExAGJLT4B2rUYMj4F2dyt6EaPbWT7Xi.jpeg\"]', 'uploads/products/thumbnail/GKUsUBqoN5mKfoKCjycBhTi9U8a9p69dj7XYILrU.jpeg', 'youtube', NULL, 'Princess Fusion Jewellery', 'Beautiful Fusion jwellary set', 875.00, 875.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 3, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Fusion jwellary set', 'Catalog Name:*Princess Fusion Jewellery Sets*\r\nBase Metal: Alloy\r\nPlating: Gold Plated\r\nSizing: Non-Adjustable\r\nType: Necklace and Earrings\r\nMultipack: 1\r\nDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any Issue\r\n*Proof of Safe Delivery! Click to know on Safety Standards of Delivery Partners- https://bit.ly/30lPKZF', 'uploads/products/meta/6sgV6xjv688Lk41F6oKem6lMU5MAe3rexKdvNFZ2.jpeg', NULL, 'Fusion-Jwellary-set-BHy2B', 0.00, NULL, 0, NULL, NULL, '2020-12-03 21:12:00', '2020-12-03 23:06:43'),
(82, 'Alloy Nacelace  set', 'seller', 35, 1, 2, 6, NULL, '[\"uploads\\/products\\/photos\\/BvJxTUm8qi2QVYJp8ZMQcMaa0N7l6zPwLXwJKfhe.jpeg\",\"uploads\\/products\\/photos\\/yZf88ioLvxrQ4SXvO7QP8mvHHi7x4u0Wt5w1RWqw.jpeg\",\"uploads\\/products\\/photos\\/mRZCpENELvK1kB7dOwF4HTNn2a2Kf0nbW6fS6Jzl.jpeg\",\"uploads\\/products\\/photos\\/NMmLc92JbsRU5bx0KvA4sh6PVl2Zzl9WAC1MCG7q.jpeg\",\"uploads\\/products\\/photos\\/B2DuMa9VgJkfEAzOgxryOT1SZrUx6nn7H97YEsR9.jpeg\"]', 'uploads/products/thumbnail/f7mdsJG5x6LTlVgnCTXrZS0PvSyO67G5DhzV9Htt.jpeg', 'youtube', NULL, 'Feminine Exquisite Alloy Jewellery Sets', 'Stylish Alloy Nacklace Set', 550.00, 550.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 4, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Clothing and Accessories', '_Make everyone\'s head turn toward you by flaunting elegance with these Pretty Be your own fashion designer! _\r\n\r\nCatalog Name: *Feminine Exquisite Alloy Jewellery Sets Vol 1*\r\n\r\nMaterial: Alloy \r\n\r\nSize: Free Size\r\n\r\nDescription: It Has 1 Piece Of  Choker Necklace& 1 Pair Of Earrings\r\n\r\nWork: Kundan & Beads  Work\r\n\r\nDispatch in  20 Days\r\n\r\nDesigns: 16\r\n\r\nEasy Returns Available In Case Of Any Issue\r\nCash on Delivery \r\nFree shipping', 'uploads/products/meta/9SOMPUMyIWh0Pyq7dqgpD5sc8If3gmL7RNFjOs2i.jpeg', NULL, 'Alloy-Nacelace--set-LpyvB', 0.00, NULL, 0, NULL, NULL, '2020-12-03 22:10:45', '2020-12-03 23:06:08'),
(83, 'Fusion jwellary set', 'seller', 35, 1, 2, 6, NULL, '[\"uploads\\/products\\/photos\\/a7Rvy38iaQqVGfjOPa3jMFiIoAO6e3iSP24rEfgb.jpeg\",\"uploads\\/products\\/photos\\/rVbyODrquYNbI1xm12KxUNjk0b2i3gOdFb8eGXJH.jpeg\",\"uploads\\/products\\/photos\\/zwKimrJApqaCOQSGJBoIGihFhsa9j5Gt6f26xQYr.jpeg\",\"uploads\\/products\\/photos\\/84zLQNuDWAF8qBnRyheGPW4oPrf3Cze1dm04dH3F.jpeg\",\"uploads\\/products\\/photos\\/jwkfH34sN86rKWDVtPuU5uj5LQ9Ak8IEU0Dy3d1m.jpeg\"]', 'uploads/products/thumbnail/Ys52S25m4Kly067ROBUAaODAgXmFnEzMyZdST2vT.jpeg', 'youtube', NULL, 'Fusion jwellary set', 'Fusion jwellary set&nbsp;', 1200.00, 1200.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 4, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Fusion jwellary set', 'Catalog Name:*Feminine Unique Jewellery Sets*\r\nBase Metal: Brass\r\nPlating: Gold Plated\r\nStone Type: Pearls\r\nSizing: Adjustable\r\nDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any Issue\r\nCash on Delivery \r\nFree shipping', 'uploads/products/meta/5LxUynvg5v15fchYHiO75zCWdlYwcPqdeOkczzzs.jpeg', NULL, 'Fusion-jwellary-set-4zeVs', 0.00, NULL, 0, NULL, NULL, '2020-12-03 22:15:00', '2020-12-03 23:05:36'),
(84, 'Unique Jwellary set', 'seller', 35, 1, 2, 6, NULL, '[\"uploads\\/products\\/photos\\/QbJ6n4LhVvg11xPkqMdGarmUizIsNKY9ORrFub5L.jpeg\",\"uploads\\/products\\/photos\\/om2mumNFuQjzPzicuChZywoVv1YHPAez7wdak3Eg.jpeg\",\"uploads\\/products\\/photos\\/h9RxTAoPAJJDVRuDfXQD4Sgq56UQTINhUeW95q5N.jpeg\",\"uploads\\/products\\/photos\\/AEezRg6K1f6Ini3f3yBEnT4PzwJcsqxCmZhQBm1v.jpeg\"]', 'uploads/products/thumbnail/0aCOHUtWNCEg5MdV0CYf3SwBCjK4Wj7zoyQoAZcv.jpeg', 'youtube', NULL, 'Allure Unique Jewellery Sets', 'Unique jwellary set&nbsp;', 700.00, 700.00, 0, '[]', '[]', '[]', NULL, 0, 1, 1, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Unique Jwellary Set', 'Allure Unique Jewellery Sets\r\n\r\nBase Metal: Brass\r\nPlating: Gold Plated\r\nStone Type: Artificial Stones & Beads\r\nSizing: Adjustable\r\nType: Necklace and Earrings\r\nMultipack: 1\r\nDispatch: 2-3 Days', 'uploads/products/meta/doFAMVv75MdWhjYWJcKBtHLvWQxQrmmanL4OyZ1d.jpeg', NULL, 'Unique-Jwellary-set-XCypN', 0.00, NULL, 0, NULL, NULL, '2020-12-03 22:18:39', '2020-12-04 10:14:06'),
(85, 'Women\'s Nacelace and chain', 'seller', 35, 1, 2, 6, NULL, '[\"uploads\\/products\\/photos\\/dh2IsUPnVWwN4Sv3MWdHRuwqD7P5kDIxPSXBCD8y.jpeg\",\"uploads\\/products\\/photos\\/YlSlmy5ctn4zdjEcifXOuXUtMhEQ1z5AhCuPiVK9.jpeg\",\"uploads\\/products\\/photos\\/T7kuLRlD8Y9MgnTieUWoLL95vzXi2vb97tCgJ5Tr.jpeg\",\"uploads\\/products\\/photos\\/0a4X06BzFNjZ6PLrNud1d6kS45mBxWQRbBpws4dD.jpeg\"]', 'uploads/products/thumbnail/GblFtuBr0kiH09VHSCsUVyXLkdO2eNGVLxzr9xo0.jpeg', 'youtube', NULL, 'Shimmering Charming Women Necklaces & Chains', 'Fancy women Nacelace and Chain', 780.00, 780.00, 0, '[]', '[]', '[]', NULL, 0, 1, 1, 2, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Women Nacklace and Chain', 'Shimmering Charming Women Necklaces & Chains\r\n\r\nBase Metal: Brass\r\nPlating: Gold Plated\r\nStone Type: Artificial Stones\r\nSizing: Adjustable\r\nType: Necklace\r\nMultipack: 1\r\nSizes: Free Size\r\nDispatch: 2-3 Days\r\nCash on Delivery \r\nFree shipping', 'uploads/products/meta/KibuRwb0zr0ltJYTR1Kt1Rrdjv6mFZ9O8sRNS8tq.jpeg', NULL, 'Womens-Nacelace-and-chain-dQTse', 0.00, NULL, 0, NULL, NULL, '2020-12-03 22:29:23', '2020-12-04 10:14:05'),
(86, 'Fancy women Nacklace and Chains', 'seller', 35, 1, 2, 6, NULL, '[\"uploads\\/products\\/photos\\/ZbduhMs2aktk9x5DG7ydjoifZpk5WZOSniVxNFKm.jpeg\",\"uploads\\/products\\/photos\\/CtGHjAUwX7gF08C4BTOxQ4qvz5RMkNXazEM04xmt.jpeg\",\"uploads\\/products\\/photos\\/pqrgJWG1a4SyIsUW5WcInJ0PjInnwnytSOdQ10ao.jpeg\",\"uploads\\/products\\/photos\\/fqgr0CuP6GRl5keefeUvEDG4IgXs3Cojno1CVsbC.jpeg\",\"uploads\\/products\\/photos\\/dcgTCaLz157a5xt26TBAgx3mIz8d6YMvTrc1PN6z.jpeg\",\"uploads\\/products\\/photos\\/G4xIMYtzLVVaCArCQgRIf5hJvjOPq2N9DHApCEnP.jpeg\",\"uploads\\/products\\/photos\\/3G2lADjrDIO7L8vuOZMhdWUbWbMg7CoV7PjQSKmG.jpeg\",\"uploads\\/products\\/photos\\/kQM0Ut2eLREqN6yocccrGcmEZDS1VobI6YjiAq2z.jpeg\",\"uploads\\/products\\/photos\\/A9HhbjvClxYHyGgwxXmrLY5mlNS3OLQBqCiTOn4W.jpeg\",\"uploads\\/products\\/photos\\/3ZpjA1kGZ31UejHTEsqi7SVBDR6kpUnY5U9AmkTL.jpeg\"]', NULL, 'youtube', NULL, 'Shimmering Glittering Women Necklaces & Chains', 'Fancy women Nacklace and Chains&nbsp;', 475.00, 475.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 10, '1', 1, 0.00, 'amount', NULL, 'amount', 'free', 0.00, 0, 'Fusion jwellary set', 'Shimmering Glittering Women Necklaces & Chains\r\n\r\nBase Metal: Meta\r\nPlating: Gold Plated - Matte\r\nStone Type: Artificial Beads\r\nSizing: Adjustable\r\nSizes: Free Size\r\nDispatch: 2-3 Days\r\nCash on Delivery \r\nFree shipping', NULL, NULL, 'Fancy-women-Nacklace-and-Chains-RnIdr', 0.00, NULL, 0, NULL, NULL, '2020-12-03 22:36:38', '2020-12-03 23:02:47'),
(87, 'Kid\'s Girl\'s Sarees', 'seller', 35, 4, 11, NULL, NULL, '[\"uploads\\/products\\/photos\\/XxAin2k8ftTHwGMYCfOPsIqmf0ffpNZ4OCaT231h.jpeg\",\"uploads\\/products\\/photos\\/Ekj36FdeqYK57oVZyfHmmbMDJP4T1RIL9kcbEmWD.jpeg\",\"uploads\\/products\\/photos\\/KqJFVTbFb74TowuHUgocZ6WF6dHVGmDC7W75AFZb.jpeg\",\"uploads\\/products\\/photos\\/KKkz82vhM5gHpTLC8mu8HB7NmiutJygkc7zmEMxq.jpeg\",\"uploads\\/products\\/photos\\/XtC7lzz2vqwmVkVNt6EcHD91mYbWQFZptVWLLLlB.jpeg\",\"uploads\\/products\\/photos\\/JXWe1qX07IpNkDfO47FD6Rqrls1AmmBh9LPY1OrQ.jpeg\"]', 'uploads/products/thumbnail/X1iPGpZRLpcEB8F9OmPHXY5SGR2oUsPXfBqiUc5v.jpeg', 'youtube', NULL, 'Princess Charming Kid\'s Girls Saree', '<p>Charming Kid\'s Girl\'s Saree&nbsp;</p><p><br></p>', 640.00, 640.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 5, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kid\'s Girl\'s Saree', 'Princess Charming Kid\'s Girls Saree  Vol 1\r\n\r\nFabric: Cotton Blended\r\nSleeves: Sleeves Are Included\r\nSize:Age Group (3 - 4 Years) - 22 in\r\nAge Group (5 - 6 Years) - 26 in\r\nAge Group (6 - 7 Years) - 28 in\r\nType: Stitched\r\nDescription: It Has 1 Piece Of Kid\'s Girl\'s Saree & 1 Piece Blouse\r\nWork : Printed\r\nCash on Delivery \r\nFree shipping', 'uploads/products/meta/j6aDaX8Vf8Z5ZQFV7YDBWtvK1T2rMKglj7FlY6hn.jpeg', NULL, 'Kids-Girls-Sarees-Rt00Q', 0.00, NULL, 0, NULL, NULL, '2020-12-04 19:06:15', '2020-12-04 19:06:15'),
(88, 'Kid\'s Girl\'s Dress', 'seller', 35, 4, 11, NULL, NULL, '[\"uploads\\/products\\/photos\\/rorB2EmQ9YSFIW8yVj7u5t5S5AIyscBD72x21Rhv.jpeg\",\"uploads\\/products\\/photos\\/j1wLJw9b4dmucEwnKU2peD5kPtRzHW8CvkzUlzT4.jpeg\"]', 'uploads/products/thumbnail/WLIkpYg6hkGZGN4Ppty8vFbACkBDCiHIr4EmDsUU.jpeg', 'youtube', NULL, 'Free Gift Trendy Anarkali Suit Sets For Girls', 'Trendy Anarkali suit sets for Girls&nbsp;', 590.00, 590.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 2, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kid\'s Girl\'s Dress', 'Free Gift Trendy Anarkali Suit Sets For Girls\r\n\r\nTop Fabric: Cotton\r\nBottom Fabric: Cotton\r\nSleeve Length: Three-Quarter Sleeves\r\nBottom type: Sharara\r\nPattern: Printed\r\nMultipack: 1\r\nSizes: \r\n6-12 Months (Top Bust Size: 20 in, Top Length Size: 9 in , Waist Size : 19 in , Length Size : 24 in )\r\n12-18 Months (Top Bust Size: 22 in, Top Length Size: 10 in , Waist Size : 20 in , Length Size : 16 in )\r\n18-24 Months (Top Bust Size: 24 in, Top Length Size: 11 in , Waist Size : 23 in , Length Size : 18 in )\r\n2-3 Years (Top Bust Size: 26 in, Top Length Size: 11 in , Waist Size : 25 in , Length Size : 20 in )\r\n3-4 Years (Top Bust Size: 27 in, Top Length Size: 12 in , Waist Size : 27 in , Length Size : 22 in )\r\n4-5 Years (Top Bust Size: 30 in, Top Length Size: 12 in , Waist Size : 29 in , Length Size : 24 in )\r\n5-6 Years (Top Bust Size: 32 in, Top Length Size: 13 in , Waist Size : 31 in , Length Size : 26 in )\r\nDispatch: 2-3 Days', 'uploads/products/meta/F9ATLk6aaHmVdYXfyN47xSPDVxYglhyRW5xsgZcJ.jpeg', NULL, 'Kids-Girls-Dress-jxF9F', 0.00, NULL, 0, NULL, NULL, '2020-12-04 19:12:04', '2020-12-04 19:12:04'),
(89, 'Kid\'s Girl\'s Lahenga Choli', 'seller', 35, 4, 11, NULL, NULL, '[\"uploads\\/products\\/photos\\/tH0OEs2QHrZnYqcRosVFH0XeYTJTzTgJSqLL2HOB.jpeg\",\"uploads\\/products\\/photos\\/nLW0bMlxYyGyBoFsBMqMVRXUIihiIirwy9sldoo3.jpeg\",\"uploads\\/products\\/photos\\/DTYDthJAbdi3pnZtewBa3RHbHHhvtQrRaj3FCdE9.jpeg\",\"uploads\\/products\\/photos\\/xVqT9juZvwaCWVR9FpT3yndwlVHcDlmzPlL5wTgN.jpeg\",\"uploads\\/products\\/photos\\/q90wIxYNd2hvRiAyfkBS8GpasUPAx7osv4s3sUj2.jpeg\",\"uploads\\/products\\/photos\\/0pcoqlQ7PNvSowgPkK6nV2O7yDBK7LPZxT9Gh9Nz.jpeg\",\"uploads\\/products\\/photos\\/Q0zoS6ltYlufU00k9GspyYfudbXWsUzJJz5s9xCD.jpeg\",\"uploads\\/products\\/photos\\/Hv4D6R5l3J0PZDmy69HcsXE55yDbYvrAPgyAMqAn.jpeg\",\"uploads\\/products\\/photos\\/705dTG0I9LJCnCQLJ4fZBfrmSVgD0ll1L6VqfXhm.jpeg\",\"uploads\\/products\\/photos\\/21PuoSMpFAphmuglDDfnJWK4WwpnZdUI70XgNLxX.jpeg\"]', NULL, 'youtube', NULL, 'Cute Stylish Kids Girls Lehanga Cholis', 'Banglori Silk kids Lehenga choli', 550.00, 550.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 5, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kid\'s Fashion', 'Cute Stylish Kids Girls Lehanga Cholis\r\n\r\nTop Fabric: Taffeta Silk\r\nLehenga Fabric: Georgette\r\nDupatta Fabric: Net\r\nSleeve Length: Sleeveless\r\nTop pattern: Zari Woven\r\nLehenga Pattern: Floral\r\ndupatta pattern: Self-Design\r\nStitch Type: Stitched\r\nMultipack: 3\r\nSizes: \r\n4-5 Years (Lehenga Waist Size: 26 in, Lehenga Length Size: 24 in, Duppatta Length Size: 1.6 m) \r\n5-6 Years (Lehenga Waist Size: 29 in, Lehenga Length Size: 27 in, Duppatta Length Size: 1.65 m) \r\n3-4 Years (Lehenga Waist Size: 26 in, Lehenga Length Size: 22 in, Duppatta Length Size: 1.5 m) \r\n6-12 Months (Lehenga Waist Size: 22 in, Lehenga Length Size: 16 in, Duppatta Length Size: 1.5 m) \r\n6-7 Years (Lehenga Waist Size: 29 in, Lehenga Length Size: 29 in, Duppatta Length Size: 1.7 m) \r\n7-8 Years (Lehenga Waist Size: 30 in, Lehenga Length Size: 30 in, Duppatta Length Size: 1.75 m) \r\n2-3 Years (Lehenga Waist Size: 25 in, Lehenga Length Size: 19 in, Duppatta Length Size: 1.5 m) \r\nDispatch: 2-3 Days\r\nCash on Delivery \r\nFree shipping', NULL, NULL, 'Kids-Girls-Lahenga-Choli-3kUr5', 0.00, NULL, 0, NULL, NULL, '2020-12-04 19:20:59', '2020-12-04 19:20:59'),
(90, 'Women\'s Jwellary Sets', 'seller', 35, 1, 2, 6, NULL, '[\"uploads\\/products\\/photos\\/d53KGIAI3JHcaZlCKmjUoxpvZOaTEWkYQX6o6Qyr.jpeg\",\"uploads\\/products\\/photos\\/JO1I9CNjLN9efgAOFbxLnb79cNGrrQfqwkqxFFEI.jpeg\",\"uploads\\/products\\/photos\\/e82Q6zJHVzxXbVqwExNXGgTaooiRkN9QjjAGjO1A.jpeg\",\"uploads\\/products\\/photos\\/pZY4L17di3MoFETSedlu6ZDclfdeMcxRE1AGJjX7.jpeg\",\"uploads\\/products\\/photos\\/1jhoqJxXgvSW8sUkU1BMOcL2lnqJeeh1Nh4t35aw.jpeg\",\"uploads\\/products\\/photos\\/XiYN5S0BlNaIDE9U18I9o76DSsz2u19LMN1NhiZU.jpeg\"]', 'uploads/products/thumbnail/dNCPV5XqKW7pOjPzQ38MylV1laJE1uVjn9oJxabY.jpeg', 'youtube', NULL, 'Allure Glittering Jewellery Sets', 'Women\'s Alloy Oxidized big Nacelace and Earrings&nbsp;', 670.00, 670.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Allure Glittering Jewellery Sets', 'Allure Glittering Jewellery Sets\r\n\r\nBase Metal: Copper\r\nPlating: Copper Plated\r\nStone Type: Artificial Stones & Beads\r\nSizing: Adjustable\r\nType: Necklace and Earrings\r\nMultipack: 1\r\nDispatch: 2-3 Days\r\nCash on Delivery \r\nFree shipping', 'uploads/products/meta/l0vfY7SN1XXQweIhkZoqWfT2MJiHTRY430guQGmj.jpeg', NULL, 'Womens-Jwellary-Sets-r9P7M', 0.00, NULL, 0, NULL, NULL, '2020-12-04 23:38:20', '2020-12-04 23:38:20'),
(91, 'Women\'s Jwellary Sets', 'seller', 35, 1, 2, 6, NULL, '[\"uploads\\/products\\/photos\\/Hs4UFuBDKOZgh4X2PVa3KFQhAfpORX1RuWfRkTsj.jpeg\",\"uploads\\/products\\/photos\\/JTiPqAto0k8NRAOhyB4h6eQh8Zu2aW7KxMpPTbln.jpeg\",\"uploads\\/products\\/photos\\/0jsleG3IB4JFp7cgKpzOVZVBCWO3rEFTuTshMk5l.jpeg\",\"uploads\\/products\\/photos\\/vHbN2ClLS6MvXh121j62hlwE1X9h6V5ePzuvIsxJ.jpeg\"]', 'uploads/products/thumbnail/36Fx4OKDSWbuuVwJTSLIzS9KtjtcTuwmBtbnBBQH.jpeg', 'youtube', NULL, 'Diva Beautiful Jewellery Sets', 'Traditional designer ethnic Set', 650.00, 650.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Women\'s jwellary set', 'Diva Beautiful Jewellery Sets\r\n\r\nBase Metal: Copper\r\nPlating: Gold Plated\r\nStone Type: Pearls\r\nSizing: Adjustable\r\nType: As Per Image\r\nDispatch: 2-3 Days\r\nCash on Delivery \r\nFree shipping', 'uploads/products/meta/0ZLcag4kGoJB9QjAPu5lJuZU3AQhkE761xpI89HG.jpeg', NULL, 'Womens-Jwellary-Sets-8NIXM', 0.00, NULL, 0, NULL, NULL, '2020-12-04 23:47:35', '2020-12-04 23:47:35'),
(92, 'Mirror Work Kurti Rani Pink', 'seller', 13, 1, 1, 1, 2, '[\"uploads\\/products\\/photos\\/JeOKNmRQweBauzqlQZzUFAWmFvHFL4tRrgq6Q5fR.jpeg\",\"uploads\\/products\\/photos\\/YbpJQYuvbeB3uhOO8PJen6evvgRyEv9f5diVlcn1.jpeg\",\"uploads\\/products\\/photos\\/11NDav2FMrSNHpeO9amRET5CePcOt7EDf8nu5qQo.jpeg\",\"uploads\\/products\\/photos\\/ylkVvKaBO0kGb9NaHb5MSzhrPEBinHFhnYdeiVQz.jpeg\"]', 'uploads/products/thumbnail/2ITfYqIBvl4aK3ysVQSagLaRzFnqyJQePSmjBrHm.jpeg', 'youtube', NULL, 'kurti-mirror-work', '<p>Styled and Designed by Aardra\'s Fashion.</p><p>Rani Pink Cotton Kurti with Mirror work</p>', 1099.00, 1099.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"L\"]}]', '[\"#FF1493\"]', NULL, 0, 1, 0, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Mirror Work Kurti Rani Pink', 'Styled and Designed by Aardra\'s Fashion\r\n\r\nRani Pink Cotton Kurti with Mirror work', 'uploads/products/meta/xGNdasxc96mle4rmWu7Z48Cf4PZWlMCvfpPNl30x.jpeg', NULL, 'Mirror-Work-Kurti-Rani-Pink-vDGwo', 0.00, NULL, 0, NULL, NULL, '2020-12-04 23:59:19', '2020-12-05 11:44:22'),
(93, 'Jaipuri Small Print Kurti with Tikki Work', 'seller', 13, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/qXvRykB1Q37mn7ml4OMeTtgIUwmsKQ1f1y6bGNXv.jpeg\",\"uploads\\/products\\/photos\\/WRcLLzgICCJniwOjXrn6So5csyFPiXLexzbPg3Cf.jpeg\",\"uploads\\/products\\/photos\\/b5WPSrXiXFSVvGkvFzGWjgN6tLpFgylKAJh3IjOA.jpeg\",\"uploads\\/products\\/photos\\/LEsN5ZNNBwwCfTTPgPtzys9eHFsd4opKKAHmtdCM.jpeg\"]', 'uploads/products/thumbnail/pBXOVnFluBoZn28NIW7oVtadrKYSdG2k8M6CthKK.png', 'youtube', NULL, 'jaipuri,small print,kurti,ethnic,indian,traditional', '<p>Pink Jaipuri Small Print Kurti  with Tikki Work\r\n</p><p>\r\nStyled and Designed by Aardara\'s Fashion.</p>', 799.00, 799.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"L\",\"M\"]}]', '[\"#FF69B4\"]', NULL, 0, 1, 0, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Jaipuri Small Print Kurti with Tikki Work', 'Pink Jaipuri Small Print Kurti  with Tikki Work\r\n\r\nStyled and Designed by Aardara\'s Fashion.', 'uploads/products/meta/nyYDZq4ZsOKidoEuxuPlKQIZ5fPdh481yOvYZDhR.png', NULL, 'Jaipuri-Small-Print-Kurti-with-Tikki-Work-p7Ksa', 0.00, NULL, 0, NULL, NULL, '2020-12-05 00:08:39', '2020-12-05 11:42:26'),
(94, 'Yellow Printed Cotton Kurti with Mirror Work', 'seller', 13, 1, 1, 1, 2, '[\"uploads\\/products\\/photos\\/JoymJIPM6fesI3RtQoX014AEswJYmc9L2f1DAMM0.jpeg\",\"uploads\\/products\\/photos\\/fklm1hHacvsRbc82pQfyRRRQlZPL1Dmdc5ITEiYv.jpeg\",\"uploads\\/products\\/photos\\/pLsdkzp1A2lLme9FhODLhgdM9MtUJzgqeYDakkAr.jpeg\",\"uploads\\/products\\/photos\\/dX2F9y3OOq3huvW8OHE1TwAmyNrL3LVvpHbic9vy.jpeg\",\"uploads\\/products\\/photos\\/LMdq12myncU6XG4anxzwd7uuYvqSLIFo806iH0Md.jpeg\"]', 'uploads/products/thumbnail/3RtnxamKMG3NX9MANhN8ZbzTtfAFigIj3m8lU6OP.jpeg', 'youtube', NULL, 'kurti,ethnic,frock style,indian,traditional,cotton,mirror work', '<p>Styled and Designed by Aardra\'s Fashion<br></p><p>Yellow Printed Cotton Kurti with Mirror Work</p>', 999.00, 999.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"XL\"]}]', '[\"#FFFF00\"]', NULL, 0, 1, 0, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Yellow Printed Cotton Kurti with Mirror Work', 'Styled and Designed by Aardra\'s Fashion\r\n\r\nYellow Printed Cotton Kurti with Mirror Work', 'uploads/products/meta/7F65jROcoo2NmSxai0zqSm4DQXzft6Pt4ry7UjGN.jpeg', NULL, 'Yellow-Printed-Cotton-Kurti-with-Mirror-Work-g5BmV', 0.00, NULL, 0, NULL, NULL, '2020-12-05 00:15:35', '2020-12-05 11:40:38'),
(95, 'Layered Short Kurti', 'seller', 13, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/dHqSHxZwGCxngyKV5DoL4tliQT4Jpmnp8sf9DP4X.png\",\"uploads\\/products\\/photos\\/OrdxtXfXQ986uhH3zPo5T8NC3F4bslR4mqxFKbIf.jpeg\",\"uploads\\/products\\/photos\\/Rq3cPG53gZtplgchIhBWE15KYRYK13Xv5SJTCmpm.jpeg\",\"uploads\\/products\\/photos\\/6Ym7j7SHmgapX7iF4yyCjxSNSEkvTbrHTQTeOW73.jpeg\"]', 'uploads/products/thumbnail/qD5jW3OWYRZ3z964DpYD0WE876pIV7y71sN8NS1l.png', 'youtube', NULL, 'layered,short kurti,indian,traditional', '<p>Styled and Designed By Aardra\'s Fashion.\r\n</p><p>\r\nBlue color Layered Short Kurti</p>', 1299.00, 1299.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"XL\"]}]', '[\"#483D8B\"]', NULL, 0, 1, 0, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Layered Short Kurti', 'Styled and Designed By Aardra\'s Fashion.\r\n\r\nBlue color Layered Short Kurti', 'uploads/products/meta/aTLrXsCSj4I6fgQxomZI2ts66sTYjSY443ojJTnt.png', NULL, 'Layered-Short-Kurti-vVQBu', 0.00, NULL, 0, NULL, NULL, '2020-12-05 00:20:02', '2020-12-05 11:38:15'),
(96, 'Lemon Yellow Cotton Kurti with Patch Work', 'seller', 13, 1, 1, 1, 2, '[\"uploads\\/products\\/photos\\/paiuXJxH1jgLsbEfZlTUJZAQb5JQ8BnijW56vgAJ.png\",\"uploads\\/products\\/photos\\/VgY1FsObXuSs69gUfzJ01ygdxn1sR85gtO3qq2Gb.png\",\"uploads\\/products\\/photos\\/AyfinhNeczk2flSHmBLKKk0Etxepj8hEQolBh35K.jpeg\",\"uploads\\/products\\/photos\\/JfGcjoETXnrszxXB7CHMNATNxlGtcLYThkj41XKc.jpeg\"]', 'uploads/products/thumbnail/AulefXBVGRhKg09FQnr9nQ3yjGgNft5gvvVkJfMB.png', 'youtube', NULL, 'cotton,kurti,indian,traditional,ethnic', '<p>Styled and Designed by Aardra\'s Fashion\r\n</p><p>\r\nLemon Yellow Cotton Kurti with Patch Work</p>', 1099.00, 1099.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"XL\"]}]', '[\"#FFFF00\"]', NULL, 0, 1, 1, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Lemon Yellow Cotton Kurti with Patch Work', 'Styled and Designed by Aardra\'s Fashion\r\n\r\nLemon Yellow Cotton Kurti with Patch Work', 'uploads/products/meta/bIA33ZfWiVceTJyGsffgLzFlUef7re2tXnLItMGo.png', NULL, 'Lemon-Yellow-Cotton-Kurti-with-Patch-Work-9p7oT', 0.00, NULL, 0, NULL, NULL, '2020-12-05 00:27:51', '2020-12-05 11:38:20'),
(97, 'Striped Cotton Kurti', 'seller', 13, 1, 1, 1, 2, '[\"uploads\\/products\\/photos\\/qshkIyi2SOEBdVp3RFT6IPK9nDsv2qZRofG0cyeW.jpeg\",\"uploads\\/products\\/photos\\/epcANs6UJUnm9VYb8JZg6p2n5XOEmmOVLrc0e4oS.jpeg\",\"uploads\\/products\\/photos\\/vB6gB0P5G7U0mduCwicDgQp9EQWKFzjnLL15SCZJ.jpeg\",\"uploads\\/products\\/photos\\/O8U1pMbTR1CuQVeUM15xmf0SV4x2VP7UPlYnJi9j.jpeg\"]', 'uploads/products/thumbnail/dwmZ0oaSzmE9HzWv5A5dhNvAe7YolnmLZBlKOMZx.jpeg', 'youtube', NULL, 'striped,cotton,kurti,ethnic,indian,traditional', '<p>Styled and Designed by Aardra\'s Fashion.\r\n</p><p>\r\nStriped Cotton Kurti</p>', 699.00, 699.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"L\"]}]', '[]', NULL, 0, 1, 0, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Striped Cotton Kurti', 'Styled and Designed by Aardra\'s Fashion.\r\n\r\nStriped Cotton Kurti', 'uploads/products/meta/lrkU5bR7KcBneV2hqVkxjr4K9wZmeDhlbBkCDqQc.jpeg', NULL, 'Striped-Cotton-Kurti-iJeLQ', 0.00, NULL, 0, NULL, NULL, '2020-12-05 00:33:32', '2020-12-05 11:34:56'),
(98, 'Printed Cotton Straight Kurti', 'seller', 13, 1, 1, 1, 2, '[\"uploads\\/products\\/photos\\/YvbYbPQT5nkDVeI0cCGqd6VtY1KDE3bcvKjVG4mc.jpeg\",\"uploads\\/products\\/photos\\/06RXM8uisWnpRnLouuIE9tq17KAJk7xvHDryqOWh.jpeg\",\"uploads\\/products\\/photos\\/WJx5XuhKKKtu26c74jMVA3q34eK1io44CNHcolRd.jpeg\"]', 'uploads/products/thumbnail/Ehg7e5GEvE97FBNYzjARjuPDOdqszbez9mBklRSY.jpeg', 'youtube', NULL, 'straight,printed,cotton,kurti,ethnic,indian,traditional', '<p>Styled and Designed by Aardra\'s Fashion.</p><p>Printed Cotton Straight Kurti in Peach Color.</p>', 699.00, 699.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"M\",\"L\"]}]', '[\"#FFDAB9\"]', NULL, 0, 1, 0, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Printed Cotton Straight Kurti', 'Styled and Designed by Aardra\'s Fashion.\r\n\r\nPrinted Cotton Straight Kurti in Peach Color.', 'uploads/products/meta/CPVyCGqiIfNx0ouMiDg2fBtYPUYfKvOVhZ1pZYYJ.jpeg', NULL, 'Printed-Cotton-Straight-Kurti-w8zKh', 0.00, NULL, 0, NULL, NULL, '2020-12-05 00:39:56', '2020-12-05 11:28:51'),
(99, 'Flower Print Cotton Kurti With Side Button', 'seller', 13, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/jWYgsmxHqtF3Uini2ehqKzFhL6WxsrAz4NHhTDVm.jpeg\",\"uploads\\/products\\/photos\\/F6BoWyVYwRfoclhrx3LjauzLc2RS3YbAFUU79H6E.jpeg\",\"uploads\\/products\\/photos\\/q94XwUyhs6XuBZ5sxhm9any0jZoP8QHmJ2VMM8XU.jpeg\",\"uploads\\/products\\/photos\\/LaocmsXC1ecgiJidP2IBbv3MaHq0BJ7xlzfRpMrZ.jpeg\"]', 'uploads/products/thumbnail/H2mqGIV2JfaFA1Fj3do6vu3Hr9030usi0h7SUFfL.jpeg', 'youtube', NULL, 'flower print,cotton,kurti,ethnic,indian,traditional', '<p>Styled and Designed by Aardra\'s Fashion.</p><p>\r\n\r\nFlower Print Cotton Kurti With Side Button</p>', 999.00, 999.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"XL\"]}]', '[]', NULL, 0, 1, 1, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Flower Print Cotton Kurti with Side Button', 'Styled and Designed by Aardra\'s Fashion.\r\n\r\nFlower Print Cotton Kurti With Side Button', 'uploads/products/meta/UVSJ4mhV8LJ3yp1jm2orZAv8gqgbL06vM1VEjDyk.jpeg', NULL, 'Flower-Print-Cotton-Kurti-With-Side-Button-U1rlx', 0.00, NULL, 0, NULL, NULL, '2020-12-05 00:45:38', '2020-12-05 10:56:32'),
(100, 'Bottle Green Cotton Straight Printed Kurti with Bottle Neck', 'seller', 13, 1, 1, 1, 2, '[\"uploads\\/products\\/photos\\/e6EeiipkbKZ9afmOgbELL26dDr5Uqxm7oHLslJG8.jpeg\",\"uploads\\/products\\/photos\\/spVuFydYqb2pkO6Hk2WdcHXBahXj0cApFSswf834.jpeg\",\"uploads\\/products\\/photos\\/EaNv7lOZdTlmME0BSQOu9VeJF1a2ZjzQ3aGeiP9H.jpeg\"]', 'uploads/products/thumbnail/YoUWNvJKmUar5wx3YdJA63zJ4ZDhFBozW33ZN9pm.jpeg', 'youtube', NULL, 'cotton,straight,kurti,ethnic,indian,printed', '<p>Styled and Designed By Aardra\'s Fashion.\r\n</p><p>\r\nBottle Green Cotton Straight Printed Kurti with Bottle Neck.</p>', 799.00, 799.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"L\"]}]', '[\"#008000\"]', NULL, 0, 1, 0, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Bottle Green Cotton Straight Printed Kurti With Bottle Neck', 'Styled and Designed By Aardra\'s Fashion.\r\n\r\nBottle Green Cotton Straight Printed Kurti with Bottle Neck.', 'uploads/products/meta/LqHoruxUjBetcqLx5HubduMqU84QiyFS3UuHx7iK.jpeg', NULL, 'Bottle-Green-Cotton-Straight-Printed-Kurti-with-Bottle-Neck-QlB3I', 0.00, NULL, 0, NULL, NULL, '2020-12-05 00:52:39', '2020-12-05 10:53:59'),
(101, 'Mehandi Green Frock Style Kurti', 'seller', 13, 1, 1, 1, 2, '[\"uploads\\/products\\/photos\\/YbzOjNKg8iIPzxS57YipqmksbKhhkmwuax6ZNzIX.jpeg\",\"uploads\\/products\\/photos\\/QCxkbCxcmuQUxb9bVMFj4ofAfplfhGNOoRFc5i9v.jpeg\",\"uploads\\/products\\/photos\\/kILabvGUSAjsA4rLrg3qekYbueqOxR8Y7zfuBvee.jpeg\",\"uploads\\/products\\/photos\\/rxuFuQpGovcMXDkliIwFU48DOvXOSF9GQ1MWv0rw.jpeg\"]', 'uploads/products/thumbnail/OzyDj7D4OAjYtQgJBYZzgwgPu33mlu0vtNrws127.jpeg', 'youtube', NULL, 'frock,style,kurti,indian,ethnic,traditional', '<p>Styled and Designed by Aardra\'s Fashion.\r\n</p><p>\r\nMehandi Green Frock Style Kurti.</p>', 799.00, 799.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"XL\"]}]', '[]', NULL, 0, 1, 0, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Mehandi Green Frock Style Kurti', 'Styled and Designed by Aardra\'s Fashion.\r\n\r\nMehandi Green Frock Style Kurti.', 'uploads/products/meta/12RWFzG3TUtIG8lYHdVz5pj7Be23upD2NPBZrslw.jpeg', NULL, 'Mehandi-Green-Frock-Style-Kurti-q3yx4', 0.00, NULL, 0, NULL, NULL, '2020-12-05 00:56:40', '2020-12-05 10:51:10'),
(102, 'Plain Peach Kurti with  Front hand Work', 'seller', 13, 1, 1, 1, 2, '[\"uploads\\/products\\/photos\\/g9nNOBp1FcuBmWoLBgbNtN494QhgoI69ZzvSv8uN.jpeg\",\"uploads\\/products\\/photos\\/LwThvbsFlCfZ08nAvXJpkfW9pXyl8T5cIlIfj4u8.jpeg\",\"uploads\\/products\\/photos\\/pmOssiyvwVEZIzLELsMZAN63hiU2VDaBrg8U9vBk.jpeg\",\"uploads\\/products\\/photos\\/hKxGo77zrY0BJnxGmUtftQZZS9fGUmkbZxjxcUOA.jpeg\"]', 'uploads/products/thumbnail/Zu893tWmHL0vt92BWoa826vnlsBBxkAou3CgO5Zv.jpeg', 'youtube', NULL, 'hand work,kurti,plain,ethnic,indian,tranditional', '<p>Styled and Designed by Aardra\'s Fashion.</p><p>\r\n\r\nPlain Peach Kurti with  Front hand Work.</p>', 1199.00, 1199.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"L\"]}]', '[]', NULL, 0, 1, 1, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Plain Peach Kurti with  Front hand Work', 'Styled and Designed by Aardra\'s Fashion.\r\n\r\nPlain Peach Kurti with  Front hand Work.', 'uploads/products/meta/f1PwV47xbyX7t65BfuBaI1R433G2QDn2J9pclDFm.jpeg', NULL, 'Plain-Peach-Kurti-with--Front-hand-Work-dbH6G', 0.00, NULL, 0, NULL, NULL, '2020-12-05 01:04:28', '2020-12-05 10:51:15'),
(103, 'Small Flower Print Cotton Kurti Pant Set with Up and Down Pattern', 'seller', 13, 1, 1, 1, 2, '[\"uploads\\/products\\/photos\\/CFhfn95PpiWOql5IA5E7txJQmIJOPfZB0NPrwwj0.jpeg\",\"uploads\\/products\\/photos\\/wrEwLkP0gLTt1PR6PtbhdVVlv2Xp8ICa989G9jcI.jpeg\",\"uploads\\/products\\/photos\\/LuMAQCYq9XlHDWwqlIZJqA2N1Gb8QNYxCdPxfyO5.jpeg\",\"uploads\\/products\\/photos\\/9H99uq78Pmi1aTdviwc5sSNoQkDm2hTrGw8xAOZG.jpeg\",\"uploads\\/products\\/photos\\/RUDeAhQBnNmSv7f8NlQwUwAiDvBBsDEFIUhHjHA0.jpeg\",\"uploads\\/products\\/photos\\/uoh4OyHTWtg4ljGS5lH5R0gryK5D7atFWhEgI6CM.jpeg\"]', 'uploads/products/thumbnail/Q1EAtvmsgGo13ZtcqWcUhfYdCcx46MkyYmDIJIL0.jpeg', 'youtube', NULL, 'kurti pant,cotton,flower,ethnic,indian', '<p>Styled and Designed by Aardra\'s Fashion.\r\n</p><p>\r\nSmall Flower Print Cotton Kurti Pant Set with Up and Down Pattern</p>', 1599.00, 1599.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"L\"]}]', '[\"#FF69B4\",\"#6A5ACD\"]', NULL, 0, 1, 1, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Small Flower Print Cotton Kurti Pant Set with Up and Down Pattern', 'Styled and Designed by Aardra\'s Fashion.\r\n\r\nSmall Flower Print Cotton Kurti Pant Set with Up and Down Pattern', 'uploads/products/meta/tJ8F7RESYjqJ6cu0cOPHXIMUAG8aixBV4B3Q35si.jpeg', NULL, 'Small-Flower-Print-Cotton-Kurti-Pant-Set-with-Up-and-Down-Pattern-NVlE4', 0.00, NULL, 0, NULL, NULL, '2020-12-05 01:14:42', '2020-12-05 10:43:36'),
(104, 'White and Blue Cotton Kurti with Front Mirror Work And Tussel', 'seller', 13, 1, 1, 1, 2, '[\"uploads\\/products\\/photos\\/Je87WZDgsCsiXlQ38paywo4wHHBNWoSwWbnJswbU.png\",\"uploads\\/products\\/photos\\/SwtGFU5IzXSEYHSlV6BJ073LL5RXzOTpTpLpW1ah.png\",\"uploads\\/products\\/photos\\/gmqZokUCPCX5hDw0WQ4QJZZww1ZcmAcaoVa2SAa1.jpeg\",\"uploads\\/products\\/photos\\/mWy8cN3jIZCQy2IK48A9nvO3xwL6KOQYcjvXpHjn.jpeg\",\"uploads\\/products\\/photos\\/1l24e0D3J1GFC5zTNI4KRaZj5zr2XOjaBlMNR3qm.jpeg\"]', 'uploads/products/thumbnail/qxdxlsCFGXA8gE9K3TxkYEXARMpjZCi3zngZm0M0.jpeg', 'youtube', NULL, 'cotton,mirror work,tussel,kurti,indian,ethnic,traditional', '<p>Styled and Designed by Aardra\'s Fashion.\r\n</p><p>\r\nWhite and Blue Cotton Kurti with Front Mirror Work AndTussel..</p>', 999.00, 999.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"XL\"]}]', '[]', NULL, 0, 1, 0, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'White and Blue Cotton Kurti with Front Mirror Work andTussel', 'Styled and Designed by Aardra\'s Fashion.\r\n\r\nWhite and Blue Cotton Kurti with Front Mirror Work AndTussel.', 'uploads/products/meta/5Cimlvv7Es5wjJEmIBZMlV75kGvrFEhCigMbcbHB.jpeg', NULL, 'White-and-Blue-Cotton-Kurti-with-Front-Mirror-Work-And-Tussel-otbmt', 0.00, NULL, 0, NULL, NULL, '2020-12-05 01:24:58', '2020-12-05 10:39:35'),
(105, 'Sky Blue Lehriya Print Cotton Kurti with Mirror Work', 'seller', 13, 1, 1, 1, 2, '[\"uploads\\/products\\/photos\\/mp6E7Jw70yAPblzIfYsU893wWGnxndzBonAIQ291.png\",\"uploads\\/products\\/photos\\/IsZTFsTVc28LUvNpIQarxjHIWBSehDqG3SoYwVtm.jpeg\",\"uploads\\/products\\/photos\\/Kctgukcvdzw8pCTKZJJM5lfXQFzfr9CGXoov7PnS.jpeg\",\"uploads\\/products\\/photos\\/TDKLRODlNnyZwA5kkWrnnEuotklc2suQIK1l6j4q.jpeg\"]', 'uploads/products/thumbnail/ghurllnVD9WY2RxocaIPI6aqjosZZKIYARgFvYRz.jpeg', 'youtube', NULL, 'Lehriya,cotton,kurti,mirror work,indian,ethnic,traditional', '<p>Styled and Designed by Aardra\'s Fashion.\r\n</p><p>\r\nSky Blue Lehriya Print Cotton Kurti with Mirror Work</p>', 1099.00, 1099.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"L\"]}]', '[]', NULL, 0, 1, 0, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Sky Blue Lehriya Print Cotton Kurti with Mirror Work', 'Styled and Designed by Aardra\'s Fashion.\r\n\r\nSky Blue Lehriya Print Cotton Kurti with Mirror Work', 'uploads/products/meta/d2KG9mGYXAbEBjAZDQfcupjc0zceYiAk1C7zhtHl.jpeg', NULL, 'Sky-Blue-Lehriya-Print-Cotton-Kurti-with-Mirror-Work-sctWi', 0.00, NULL, 0, NULL, NULL, '2020-12-05 01:36:28', '2020-12-05 10:37:14'),
(106, 'Yellow Cotton Kurti with Feather Hand Work', 'seller', 13, 1, 1, 1, 2, '[\"uploads\\/products\\/photos\\/xhD7Wyc289YUNA3HoInRkt6l97dxa5bcZKPoit9Q.jpeg\",\"uploads\\/products\\/photos\\/OrTGKSStjO23wjF6KJXMaqibbrsrFPqFNwx9Wxx7.png\",\"uploads\\/products\\/photos\\/RcPhfJgFbWmm6oSs1laC2WpzTjUob5lmMkqglWUe.jpeg\"]', 'uploads/products/thumbnail/MTs2CtRBMjVDxlFXXZaoPBOClfmf8m11lcmgO9Fa.jpeg', 'youtube', NULL, 'feather work,cotton,kurti,ethnic,indian,traditional', '<p>Styled and Designed by Aardra\'s Fashion.\r\n</p><p>\r\nYellow Cotton Kurti with Feather Hand Work.</p>', 999.00, 999.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"L\"]}]', '[]', NULL, 0, 1, 0, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Yellow Cotton Kurti with Feather Hand Work', 'Styled and Designed by Aardra\'s Fashion.\r\n\r\nYellow Cotton Kurti with Feather Hand Work.', 'uploads/products/meta/LBY6Jr85Mklo9nr2taffgJUtJvLdvuuXTvHYtew5.jpeg', NULL, 'Yellow-Cotton-Kurti-with-Feather-Hand-Work-BrpDk', 0.00, NULL, 0, NULL, NULL, '2020-12-05 01:40:16', '2020-12-05 10:34:48'),
(107, 'Bottle Green Angarkha Style Anarkali Cotton Kurti with Mirror Work', 'seller', 13, 1, 1, 1, 2, '[\"uploads\\/products\\/photos\\/XlqN9vtkyZZhfIFIAq20MU26RBuM0ublctCN15A2.jpeg\",\"uploads\\/products\\/photos\\/TmwTcHDYHEySLWppCAZ3QZ02N2iLAZ9gYxHGfl4D.jpeg\",\"uploads\\/products\\/photos\\/iRgRYENFXYANm8aKlWmUjvXKvGVY1Ottq4k6xu6X.jpeg\"]', 'uploads/products/thumbnail/Eyw74iq8byVMsBSaNkC4YjLYNUWgrsPiJMuirJDo.jpeg', 'youtube', NULL, 'angarkha,anarkali,kurti,cotton,ethnic,traditional,indian', '<p>Styled and Designed by Aardra\'s Fashion.\r\n</p><p>\r\nBottle Green Angarkha Style Anarkali Cotton Kurti with Mirror Work.</p>', 1199.00, 1199.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"L\"]}]', '[]', NULL, 0, 1, 0, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Bottle Green Angarkha Style Anarkali Cotton Kurti with Mirror Work', 'Styled and Designed by Aardra\'s Fashion.\r\n\r\nBottle Green Angarkha Style Anarkali Cotton Kurti with Mirror Work.', 'uploads/products/meta/YntxibCdQWZOL03x25trDEZJEeUdCiIKPfaefZGL.jpeg', NULL, 'Bottle-Green-Angarkha-Style-Anarkali-Cotton-Kurti-with-Mirror-Work-E9kIr', 0.00, NULL, 0, NULL, NULL, '2020-12-05 01:47:37', '2020-12-05 10:32:41'),
(108, 'Multi Color Cotton Kurti with Patch Hand Work', 'seller', 13, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/JBHhZZ4FzvZMjkYYgwrpd6L8rqzJ8GIOuGepqA5v.jpeg\",\"uploads\\/products\\/photos\\/EjN6uiCmZM75ZNA7w37B5ZxIj9FIegkTAMKlBdJu.jpeg\",\"uploads\\/products\\/photos\\/rCreh6ajhSDYzJb1wJfFcUWi7C6XR1CKqtG8ai33.jpeg\",\"uploads\\/products\\/photos\\/icQfJ7aD2nzrKe78gsJeRrUhKK4teEqKAlAL5cbY.jpeg\",\"uploads\\/products\\/photos\\/PLIzKWJnxHr3J7UAxSBArgLpIHGP56pupBY7yyVf.jpeg\"]', 'uploads/products/thumbnail/p6IUAWAj1XJ3C7h2mPNr3YsGK4D0VAtA7xFroqAO.jpeg', 'youtube', NULL, 'multi color,kurti,patch work,hand work,ethnic,indian,traditional,cotton', '<p>Styled and Designed by Aardra\'s Fashion.</p><p>Multi Color Cotton Kurti with Patch Hand Work</p>', 899.00, 899.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"L\"]}]', '[]', NULL, 0, 1, 0, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Multi Color Cotton Kurti with Patch Hand Work', 'Styled and Designed by Aardra\'s Fashion.\r\n\r\nMulti Color Cotton Kurti with Patch Hand Work', 'uploads/products/thumbnail/p6IUAWAj1XJ3C7h2mPNr3YsGK4D0VAtA7xFroqAO.jpeg', NULL, 'Multi-Color-Cotton-Kurti-with-Patch-Hand-Work-iS8a3', 0.00, NULL, 0, NULL, NULL, '2020-12-05 01:51:06', '2020-12-05 10:26:00');
INSERT INTO `products` (`id`, `name`, `added_by`, `user_id`, `category_id`, `subcategory_id`, `subsubcategory_id`, `brand_id`, `photos`, `thumbnail_img`, `video_provider`, `video_link`, `tags`, `description`, `unit_price`, `purchase_price`, `variant_product`, `attributes`, `choice_options`, `colors`, `variations`, `todays_deal`, `published`, `featured`, `current_stock`, `unit`, `min_qty`, `discount`, `discount_type`, `tax`, `tax_type`, `shipping_type`, `shipping_cost`, `num_of_sale`, `meta_title`, `meta_description`, `meta_img`, `pdf`, `slug`, `rating`, `barcode`, `digital`, `file_name`, `file_path`, `created_at`, `updated_at`) VALUES
(109, 'Navy Blue Plain Cotton Kurti with Hand Work', 'seller', 13, 1, 1, 1, 2, '[\"uploads\\/products\\/photos\\/x35Fko10uMb9lZAaIcy4pOCEwwp4mUUSmEE9TZCb.jpeg\",\"uploads\\/products\\/photos\\/txY79fmO3ew3Ai8O8CG8cOmTN7DXGBsJV4rJF3bN.jpeg\",\"uploads\\/products\\/photos\\/KMib41Ibye1rM6Q9cZJKDEHxTyqkMWOWh5bOnvGw.jpeg\",\"uploads\\/products\\/photos\\/7pMEeYB1vQWGo7QlvqVce1t2mx49KFWGxQZW6U5H.jpeg\"]', 'uploads/products/thumbnail/HRQj90vbR1HqwmZMi19irUdTgERsQGA74lMfagY1.jpeg', 'youtube', NULL, 'cotton,hand work,ethnic,traditional,indian', '<p>Styled and Designed by Aardra\'s Fashion.</p><p>\r\n\r\nNavy Blue Plain Cotton Kurti with Hand Work</p>', 1099.00, 1099.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"XL\"]}]', '[]', NULL, 0, 1, 1, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Navy Blue Plain Cotton Kurti with Hand Work', 'Styled and Designed by Aardra\'s Fashion.\r\n\r\nNavy Blue Plain Cotton Kurti with Hand Work', 'uploads/products/meta/CBHLFMUWllQOBWXXJ3kRkEozMJ5DZYicqOT7lsHk.jpeg', NULL, 'Navy-Blue-Plain-Cotton-Kurti-with-Hand-Work-buPuT', 0.00, NULL, 0, NULL, NULL, '2020-12-05 01:57:35', '2020-12-05 10:22:50'),
(110, 'Multi Color Ajarakh Printed Angarkha Style Kurti', 'seller', 13, 1, 1, 1, 2, '[\"uploads\\/products\\/photos\\/YAiho92NUoQD7s0zDZWb91n2qTP49KEVDOizExWr.jpeg\",\"uploads\\/products\\/photos\\/qP4invNt1jcXkaLWQhwng8JBvBNSZK023FucBmE3.png\",\"uploads\\/products\\/photos\\/CJ0MxmTvJKzVuZdw6tI6O7YK8FmnGclAQC7ytABt.jpeg\",\"uploads\\/products\\/photos\\/3e9rC4wSdeRRIxyrZGgLOlthTKgjDsDI8YDu8oqJ.jpeg\"]', 'uploads/products/thumbnail/x69NFuDIwfOj4tqLlDb4XbhRso8bDBr0lBNHesub.jpeg', 'youtube', NULL, 'ajarakh,angarkha,ethnic,cotton,kurti,indian,traditional', 'Multi Color Ajarakh Printed Angarkha Style Kurti', 799.00, 799.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"L\"]}]', '[]', NULL, 0, 1, 1, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Multi Color Ajarakh Printed Angarkha Style Kurti', 'Multi Color Ajarakh Printed Angarkha Style Kurti', 'uploads/products/thumbnail/x69NFuDIwfOj4tqLlDb4XbhRso8bDBr0lBNHesub.jpeg', NULL, 'Multi-Color-Ajarakh-Printed-Angarkha-Style-Kurti-5tt2n', 0.00, NULL, 0, NULL, NULL, '2020-12-05 02:05:26', '2020-12-05 10:20:38'),
(111, 'Black Cotton Kurti with Hand Work', 'seller', 13, 1, 1, 1, 2, '[\"uploads\\/products\\/photos\\/pMVXqNkRnf8WRNBhL0fdhek8GkOmElRnoJyY3jNJ.jpeg\",\"uploads\\/products\\/photos\\/CgFSNEYNwKxxWTFj5C5hLBW45ltAOhRQOpQJqbLI.png\",\"uploads\\/products\\/photos\\/YWPlljir7ylaYvC92CyAaYZJ1X7Qs6xNiVucN0if.jpeg\",\"uploads\\/products\\/photos\\/NhufwWT3iTVXYiCuky4t7GxBrybMBL4hLI1wDsyY.jpeg\"]', 'uploads/products/thumbnail/HucBF8JHpsMS7Bw0mN7jzfjV0bns5cyBS5hnXkrW.jpeg', 'youtube', NULL, 'hand work,cotton,kurti,indian,ethnic,traditional', 'Black Cotton Kurti with Hand Work', 699.00, 699.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"XL\"]}]', '[]', NULL, 0, 1, 1, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Black Cotton Kurti with Hand Work', 'Black Cotton Kurti with Hand Work', 'uploads/products/meta/SIpyX883BcXG8lrPMQHFinbu0ocRTXL6Uell08U0.jpeg', NULL, 'Black-Cotton-Kurti-with-Hand-Work-ZCBcx', 0.00, NULL, 0, NULL, NULL, '2020-12-05 02:08:48', '2020-12-05 10:19:21'),
(112, 'Sky Blue Cotton Kurti with Mirror Work', 'seller', 13, 1, 1, 1, 2, '[\"uploads\\/products\\/photos\\/X6V8Uj2dIbEUV4UlSZQoAk3zQEnXFwdBaUwuglOP.jpeg\",\"uploads\\/products\\/photos\\/RcmckXfrwAcMJPcgaEwk8JxSbOU0Chn7748qy4wE.png\",\"uploads\\/products\\/photos\\/1YfSkbiRuDeld1g7tehvDCTMw3PFUJlP8GfsDmFO.jpeg\",\"uploads\\/products\\/photos\\/9xNY19ThLXvxEz6ZNA3fvzX6zVfaUIo0SrBItXFw.jpeg\"]', 'uploads/products/thumbnail/CZmy3tf1Fi4LfIkn9tWV7k7x4dHuqH4vKNPqFyoJ.jpeg', 'youtube', NULL, 'cotton,mirror work,indian,ethnic,traditional', 'Sky Blue Cotton Kurti with Mirror Work.', 899.00, 899.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"L\"]}]', '[]', NULL, 0, 1, 1, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Sky Blue Cotton Kurti with Mirror Work', 'Sky Blue Cotton Kurti with Mirror Work.', 'uploads/products/meta/7XTbfmg89fCvTHCDAUX5z3zoGf1AE53wvpghpsJ6.jpeg', NULL, 'Sky-Blue-Cotton-Kurti-with-Mirror-Work-4776c', 0.00, NULL, 0, NULL, NULL, '2020-12-05 02:13:56', '2020-12-05 10:18:06'),
(113, 'Maroon Cotton Kurti', 'seller', 13, 1, 1, 1, 2, '[\"uploads\\/products\\/photos\\/nG89DJNznoQG2KTR4Y9v4BSx9JlKZ1vldBl1tOuU.jpeg\",\"uploads\\/products\\/photos\\/JyWj5UjzXx9glG8j8lucPbkNosuINVlXDx9dbZ4E.png\",\"uploads\\/products\\/photos\\/eqmOWC8qSMZMVWx6PTl41jp1dWr81cFT9Ebu1FFV.jpeg\",\"uploads\\/products\\/photos\\/Wrajkg0ZEHQLGYQubPIlG5VjsTk7HFybjzwoAK09.jpeg\"]', 'uploads/products/thumbnail/DfkYTGtGvBEhulpOnAl8PlYyFBOqKcNYcgDxY00r.jpeg', 'youtube', NULL, 'cotton,kurti,ethnic,indian,traditional', 'Maroon Cotton Kurti.', 899.00, 899.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"XL\"]}]', '[]', NULL, 0, 1, 1, 0, 'pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Maroon Cotton Kurti', 'Maroon Cotton Kurti', 'uploads/products/meta/eoITdRRycngezoJN3TzhUGEBxDRZ9nC7UlH9rRlI.jpeg', NULL, 'Maroon-Cotton-Kurti-TB8LV', 0.00, NULL, 0, NULL, NULL, '2020-12-05 02:17:39', '2020-12-05 10:16:26'),
(114, 'Anarkali Suit', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/8siDwca0ERZ9ZaOPUtam8kLle1Ah499ZOpwNznlF.jpeg\"]', 'uploads/products/thumbnail/Fk7HJdoOZQ19FKfIRP48E317uigzlnqwOIanocmG.jpeg', 'youtube', NULL, 'Anarkali Suit,Georgette', 'Top-Apple Georgette, Bottom &amp; Inner-Dull Santoon, \r\nDupatta-Nazneen ,\r\nSize L, \r\nTop Length : 52\", Bottom Unstitched : 2.2 Mtrs., Dupatta : 2.15 Mtrs.', 3737.00, 3737.00, 1, '[\"2\"]', '[{\"attribute_id\":\"2\",\"values\":[\"Georgette\"]}]', '[\"#8FBC8F\"]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Anarkali Suit', 'Top-Apple Georgette, Bottom & Inner-Dull Santoon, \r\nDupatta-Nazneen ,\r\nSize L, \r\nTop Length : 52\", Bottom Unstitched : 2.2 Mtrs., Dupatta : 2.15 Mtrs.', 'uploads/products/meta/uKC7OcYuqOD71MPdl8BCcpIBHSOPSnwg4Icw8vGJ.jpeg', NULL, 'Anarkali-Suit-utZmQ', 0.00, NULL, 0, NULL, NULL, '2020-12-06 13:06:26', '2020-12-06 13:14:14'),
(115, 'Blue Semi Stiched Woven Unstiched Lehenga Choli', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/aVTdwmvGUBYpRgVeashYnPtqbRb9hAGfucZp3QQh.jpeg\",\"uploads\\/products\\/photos\\/OGlYodt5ub9oL9hSmpG3t58pwyDzt2Lw4biLAvkG.jpeg\",\"uploads\\/products\\/photos\\/nuIAdFwyFuZYVQ3g18PDBE1JKmzHVujDBjaMSFKf.jpeg\",\"uploads\\/products\\/photos\\/VY6qi3ksMrcLOSvXEvpeGVk0OnJ9fNFnmz7FlB6k.jpeg\",\"uploads\\/products\\/photos\\/mSFRMkjNjc1QBeniBuk3bXoGDK4qSPADVUNVBvlK.jpeg\",\"uploads\\/products\\/photos\\/AwadqwrOTA75ig1FtUUaUio1PdwWYoHIVM0hRx7s.jpeg\"]', 'uploads/products/thumbnail/sKmRQIT0MZBe5TmM4c0KltB1krKzVRPW2ToyGTAN.jpeg', 'youtube', NULL, 'Lehenga Choli, Semi Stiched, Woven,Jacquard', 'Lehenga:-Jacquard 42 Inch\r\nBlouse:-Jacquard 0.80 Mtr \r\nDupatta:-Net 2.25 Mtr, \r\nInner / Slip: Attached Inside', 1728.00, 1728.00, 1, '[\"2\"]', '[{\"attribute_id\":\"2\",\"values\":[\"Jacquard\"]}]', '[\"#0000FF\"]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Blue Semi Stiched Woven Unstiched Lehenga Choli', 'Lehenga:-Jacquard 42 Inch\r\nBlouse:-Jacquard 0.80 Mtr \r\nDupatta:-Net 2.25 Mtr, \r\nInner / Slip: Attached Inside', 'uploads/products/meta/zhNWH2MgPMn4ODoAqLPIzYUdZHngzfwZfxI4dc2f.jpeg', NULL, 'Blue-Semi-Stiched-Woven-Unstiched-Lehenga-Choli-tDzul', 0.00, NULL, 0, NULL, NULL, '2020-12-06 13:13:47', '2020-12-06 13:13:47'),
(116, 'Long Anarkali Suit', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/sznGsEqfDYQ7tEfjVYrGLuID26zN9U5Cz3PLg4Pb.jpeg\"]', 'uploads/products/thumbnail/1weRoSK03veLJ4BFOaP7yMomK0AEjYWPJXdAdmQv.jpeg', 'youtube', NULL, 'Anarkali Suit,Georgette', '<p><u>Top-Apple Georgette,\r\n</u></p><p><u>Bottom &amp; Inner-Dull Santoon, </u></p><p><u>\r\nDupatta-Nazneen ,\r\nSize L, Top Length : 52\", Bottom Unstitched : 2.2 Mtrs., LDupatta : 2.15 Mtrs.</u></p>', 3636.00, 3636.00, 1, '[\"1\",\"2\"]', '[{\"attribute_id\":\"1\",\"values\":[\"L\"]},{\"attribute_id\":\"2\",\"values\":[\"Georgette\"]}]', '[\"#FFA500\"]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Long Anarkali Suit', 'Top-Apple Georgette,\r\nBottom & Inner-Dull Santoon, \r\nDupatta-Nazneen ,\r\nSize L, Top Length : 52\", Bottom Unstitched : 2.2 Mtrs., Dupatta : 2.15 Mtrs.', 'uploads/products/meta/ZyU7v8Lo9blB2kit2a9JRFFLwgmPVWwAWLARxrpa.jpeg', NULL, 'Long-Anarkali-Suit-ujB5o', 0.00, NULL, 0, NULL, NULL, '2020-12-06 13:19:37', '2020-12-06 13:19:37'),
(117, 'Raw Silk Embroidery Lehenga Choli with Duppatta', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/s0u6vanmpatgd3JqTcuANGFJrobjk2NAXjyPf61M.jpeg\"]', 'uploads/products/thumbnail/TYBuHZYGYqrzmdvVYTIDwOgltMv0z3Va9YC3AIif.jpeg', 'youtube', NULL, 'Embroidery, Lehenga Choli, Raw Silk', 'Lehenga Fabric: Raw Silk,\r\n Lehenga Length: 2 Meter, \r\nCholi Fabric: Raw Silk , \r\nCholi Length: 2 Meter, \r\nDupatta Fabric: Net, \r\nLehenga Sizeupto 46, \r\nDupatta Size- 2.5 Meters', 8487.00, 8487.00, 1, '[\"2\",\"3\"]', '[{\"attribute_id\":\"2\",\"values\":[\"Silk\"]},{\"attribute_id\":\"3\",\"values\":[\"Green + Blue\"]}]', '[]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Raw Silk Embroidery Lehenga Choli with Duppatta', 'Lehenga Fabric: Raw Silk,\r\n Lehenga Length: 2 Meter, \r\nCholi Fabric: Raw Silk , \r\nCholi Length: 2 Meter, \r\nDupatta Fabric: Net, \r\nLehenga Sizeupto 46, \r\nDupatta Size- 2.5 Meters', 'uploads/products/meta/hYeLOvwRsB00KLtYOkJJEVx8ngoWSiUGIO8dP6Zq.jpeg', NULL, 'Raw-Silk-Embroidery-Lehenga-Choli-with-Duppatta-Eo9ZH', 0.00, NULL, 0, NULL, NULL, '2020-12-06 13:25:49', '2020-12-06 13:25:49'),
(118, 'Rayon Embroidery Straight Kurti with Palazzo', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/ufK0RwFCqsh7tfYBaNScQY3K49WbTIHP85iQZQPn.jpeg\"]', 'uploads/products/thumbnail/tb7aCrI9p7u3H9hGdlir9FOrIGHBLR0EBiyvWdNA.jpeg', 'youtube', NULL, 'Rayon, Embroidery', '<p>Interlocking-White / Other Thread\r\n</p><p>\r\nRayon Embroidery Straight Kurti with Palazzo\r\n</p><p>\r\nLength : 45-46 inch\r\n</p><p>\r\n3/4 Sleeve</p>', 1349.00, 1349.00, 1, '[\"1\",\"2\"]', '[{\"attribute_id\":\"1\",\"values\":[\"42\",\"44\"]},{\"attribute_id\":\"2\",\"values\":[\"Rayon\"]}]', '[\"#ADD8E6\"]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Rayon Embroidery Straight Kurti with Palazzo', 'Interlocking-White / Other Thread\r\n\r\nRayon Embroidery Straight Kurti with Palazzo\r\n\r\nLength : 45-46 inch\r\n\r\n3/4 Sleeve', 'uploads/products/meta/YBMQYrGtQedT4Tm29gCBimKYcyuCWWj4if7xna0d.jpeg', NULL, 'Rayon-Embroidery-Straight-Kurti-with-Palazzo-QA0FH', 0.00, NULL, 0, NULL, NULL, '2020-12-06 20:20:29', '2020-12-06 20:20:29'),
(119, 'Rayon Embroidery Kurti with Pant', 'seller', 34, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/cSd3NeoRQpf9R6BKGuPEQTcC7GXaggCF2GvirKcj.jpeg\"]', 'uploads/products/thumbnail/kP9IPKJcxahDJmUP0baRqyvpnqkdckoAmK9JBrRS.jpeg', 'youtube', NULL, 'Rayon,  Embroidery', '<p>\r\nRayon Embroidery Kurti with Pant\r\n</p><p>\r\nLength : 41-42 inch\r\n</p><p>\r\n3/4 Sleeve</p>', 899.00, 899.00, 1, '[\"1\",\"2\"]', '[{\"attribute_id\":\"1\",\"values\":[\"38\",\"40\",\"42\",\"44\"]},{\"attribute_id\":\"2\",\"values\":[\"Rayon\"]}]', '[\"#ADFF2F\"]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Rayon Embroidery Kurti with Pant', 'Rayon Embroidery Kurti with Pant\r\n\r\nLength : 41-42 inch\r\n\r\n3/4 Sleeve', 'uploads/products/meta/4XUdg2ngPTVWbXbdNmsvC2CHSwdivL8DEsBHOe9q.jpeg', NULL, 'Rayon-Embroidery-Kurti-with-Pant-4dybh', 0.00, NULL, 0, NULL, NULL, '2020-12-06 20:26:06', '2020-12-06 20:26:06'),
(120, 'Reyon Kurtis', 'seller', 35, 1, 1, 2, NULL, '[\"uploads\\/products\\/photos\\/6MEPPi3sOA0xObkKRpNZPQ4GuROBmJKzgSD1b57h.jpeg\",\"uploads\\/products\\/photos\\/FzcpFMHQJWxwOAjTO3TdNZGcdGln3rl47GbzpTzC.jpeg\",\"uploads\\/products\\/photos\\/EEDKUCO3yqLcL3Pmo3QdFkHKJqBO7szEHAbO8Gml.jpeg\"]', 'uploads/products/thumbnail/W6Ji9YA7RGdWLGrAgch84TJxMkwiRmN7rH2inQvo.jpeg', 'youtube', NULL, 'Charvi Petite Kurtis', 'Reyon Kurtis&nbsp;', 550.00, 550.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Reyon Kurtis', 'Charvi Petite Kurtis\r\n\r\nFabric: Rayon\r\nSleeve Length: Sleeveless\r\nPattern: Printed\r\nCombo of: Single\r\nSizes:\r\nXL (Size Length: 50 in) \r\nL (Size Length: 50 in) \r\nXXL (Size Length: 50 in) \r\nM (Size Length: 50 in) \r\nDispatch: 2-3 Days\r\nCash on Delivery \r\nFree shipping', 'uploads/products/meta/LXGQxhyrwm6xDIVLOkMaO4FqgpiS7rPtEfSKYXqi.jpeg', NULL, 'Reyon-Kurtis-kMdao', 0.00, NULL, 0, NULL, NULL, '2020-12-06 22:42:51', '2020-12-06 22:42:51'),
(121, 'Useful home Utility', 'seller', 35, 3, 7, 19, NULL, '[\"uploads\\/products\\/photos\\/K645kjAXqdtZ0KnOPGi4bA7Bm2TLkjdkVHghNP5I.jpeg\",\"uploads\\/products\\/photos\\/v8zJNuZBuZd3XDpaPOAr2ktLEU8bcBNDYHyiQoQA.jpeg\",\"uploads\\/products\\/photos\\/kPdlorLJuHk7uGAdfI6sviXAhicerucqcaZpWocg.jpeg\",\"uploads\\/products\\/photos\\/w7ZM1OW9gD6a7LNZSKrdXtbfAp1NtpdZ3VWWq2M5.jpeg\",\"uploads\\/products\\/photos\\/tYyobZHNmnKxaHvBypWDCevEx5pS1lf01TJMDABx.jpeg\"]', 'uploads/products/thumbnail/4oDbghh1Jnh7iQPh079pO7zIE6GLtuvVXH4weblo.jpeg', 'youtube', NULL, 'Clay Products', 'Useful Home Utility&nbsp;', 515.00, 515.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 4, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Home Utility', 'Adore Usefull Other Home Utility Vol 12\r\n\r\nMaterial: Terracotta\r\nCapacity: 120 ml\r\nDescription: It Has 6 Pieces Of Cups\r\nCash on Delivery \r\nFree shipping', 'uploads/products/meta/6nnJm3taYmc0srRFgBMCLw6TnsDLYnCNJ5PngOaO.jpeg', NULL, 'Useful-home-Utility-I041u', 0.00, NULL, 0, NULL, NULL, '2020-12-06 23:01:14', '2020-12-07 10:38:41'),
(122, 'Dining Table Cover', 'seller', 35, 3, 7, 19, NULL, '[\"uploads\\/products\\/photos\\/tfAgXpNIPxVvFu2Jaj7KIdPHoXlnsQzsJTn0Ngq0.jpeg\",\"uploads\\/products\\/photos\\/GjpM7LPWJQINRO0xOEyBPOiAVbpkUwptK554fwU1.jpeg\",\"uploads\\/products\\/photos\\/aFysVXiDpFrGv3eKSVuNc2gQWv1WeWVYAjHEbBE9.jpeg\",\"uploads\\/products\\/photos\\/Ww2nrNh4UftIFV98uamyC325h8IUnyVh0N68p3ZQ.jpeg\"]', 'uploads/products/thumbnail/pEgVlo860mvRN0eU7G4ljPWCY79MDiqKXvzC21V4.jpeg', 'youtube', NULL, 'Latest Table Cover  Material: PVC', 'Dining Table Cover&nbsp;', 320.00, 320.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Dining Table Cover', 'Latest Table Cover\r\n\r\nMaterial: PVC\r\nPack: Pack of 1\r\nPattern: Printed\r\nlength: 60 Inch\r\nbreadth: 40 Inch\r\nheight: 2 Inch\r\nDispatch: 2-3 Days', 'uploads/products/meta/DTZtZ6AEqM78v4EWdTNwTdalgzQUO8iGFPm9iCyl.jpeg', NULL, 'Dining-Table-Cover-rMKDb', 0.00, NULL, 0, NULL, NULL, '2020-12-06 23:10:10', '2020-12-06 23:10:10'),
(123, 'Trendy Table Cover', 'seller', 35, 3, 7, 19, NULL, '[\"uploads\\/products\\/photos\\/YE54YtKQ3cvF1MaKzY8LKS3EwLRO6ZD2Luv2xis4.jpeg\"]', 'uploads/products/thumbnail/OfMETlv3vzvx8dCpVSr1XQlnlMpUp1fQ9slgMEas.jpeg', 'youtube', NULL, 'Free Mask Elite Dream Home Trendy Table Covers', 'Trendy Table Cover&nbsp;', 340.00, 340.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Trendy Table Cover', 'Free Mask Elite Dream Home Trendy Table Covers Vol 9\r\n\r\nMaterial: PVC\r\nSize (Diameter): 60 in  \r\nDescription: It Has 1 Piece Of 4 seater Round Table Cover\r\nWork: Printed', 'uploads/products/meta/fbfURIScYG9TLhGQ1xzRz8bjI1bzEdjzaetvUAFe.jpeg', NULL, 'Trendy-Table-Cover-kVdnU', 0.00, NULL, 0, NULL, NULL, '2020-12-06 23:15:22', '2020-12-06 23:15:22'),
(124, 'Classy Table Cover', 'seller', 35, 3, 7, 19, NULL, '[\"uploads\\/products\\/photos\\/g4oB0HdURqC8RmvGGwmOTUGP5WPea1pduso17b67.jpeg\",\"uploads\\/products\\/photos\\/SVSQngaAtc5znywDCdohg1097gWK5mZfqjt8SVgq.jpeg\",\"uploads\\/products\\/photos\\/l5HiETu8g8BO63TPRV5Asrb0JaJfQh0jQf3QDPXb.jpeg\"]', 'uploads/products/thumbnail/P0Z8PNfP8naZLkCz1OoVfNeVyz92vrk20p2cLDZb.jpeg', 'youtube', NULL, 'Classy Table Cover  Material: PVC', 'Classy Table Cover&nbsp;', 320.00, 320.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Classy Table Cover', 'Classy Table Cover\r\n\r\nMaterial: PVC\r\nPack: Pack of 1\r\nPattern: Lace Work\r\nlength: 90 Inch\r\nbreadth: 6 Inch\r\nDispatch: 2-3 Days', 'uploads/products/thumbnail/P0Z8PNfP8naZLkCz1OoVfNeVyz92vrk20p2cLDZb.jpeg', NULL, 'Classy-Table-Cover-UkIpz', 0.00, NULL, 0, NULL, NULL, '2020-12-06 23:18:56', '2020-12-06 23:18:56'),
(125, 'Oxidized Bracelet', 'seller', 35, 1, 2, 6, NULL, '[\"uploads\\/products\\/photos\\/z7bNm2GySsOUTLCaoc3VH0ZtRakrjcx6DVCuxrKz.jpeg\"]', 'uploads/products/thumbnail/hprYXciDkbX4LbxFL5kjgMnO9I9F9CcmgcksDCOA.jpeg', 'youtube', NULL, 'Elite Fancy Bracelet & Bangles  Base Metal: Alloy Plating: Variable (Product Dependent) Stone Type: Artificial Stones & Beads Sizing: Adjustable Type: Haathphool/ Haathpanja', 'Fancy bracelets&nbsp;', 315.00, 315.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 1, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Oxidized Bracelet', 'Elite Fancy Bracelet & Bangles\r\n\r\nBase Metal: Alloy\r\nPlating: Variable (Product Dependent)\r\nStone Type: Artificial Stones & Beads\r\nSizing: Adjustable\r\nType: Haathphool/ Haathpanja\r\nMultipack: 1\r\nSizes: Free Size\r\nDispatch: 2-3 Days', 'uploads/products/meta/G2wu73ywSoxbOPQWmLexokNVf4DPD7c8zPgT9t6m.jpeg', NULL, 'Oxidized-Bracelet-v783S', 0.00, NULL, 0, NULL, NULL, '2020-12-07 15:12:26', '2020-12-07 15:12:26'),
(126, 'Graceful Sarees', 'seller', 35, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/UhUBSIrR60NOCVPZVBHBPGEtxjYjdSZkwfmsH4oA.jpeg\",\"uploads\\/products\\/photos\\/DooS4ZdZ4UfnXr69c7kzQn6shUmwvZ3NGKc0AH8W.jpeg\",\"uploads\\/products\\/photos\\/bjZQ7ti1LUxS2Djphc78sAnduTLHpKc9LhOGUyc5.jpeg\",\"uploads\\/products\\/photos\\/6FSusctm8d4IEYRpHVquJxBft9dWCKX2NzOs6din.jpeg\",\"uploads\\/products\\/photos\\/Rw32a4pVWyP8tVGjUfmYHqtJpBr1meFRRIN4V6IZ.jpeg\"]', 'uploads/products/thumbnail/dKY9RweZWA3ZVA47vja4eL0UVyW2wnwGUMAs4mdV.jpeg', 'youtube', NULL, 'Aagyeyi Graceful Sarees  Saree Fabric: Georgette Blouse: Running Blouse Blouse Fabric: Silk Pattern:', 'Beautiful Graceful Sarees', 1050.00, 1050.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 5, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Graceful Sarees', 'Aagyeyi Graceful Sarees\r\n\r\nSaree Fabric: Georgette\r\nBlouse: Running Blouse\r\nBlouse Fabric: Silk\r\nPattern: Embroidered\r\nBlouse Pattern: Embroidered\r\nMultipack: Single\r\nSizes: \r\nFree Size (Saree Length Size: 5.5 m, Blouse Length Size: 0.8 m) \r\nDispatch: 2-3 Days', 'uploads/products/thumbnail/dKY9RweZWA3ZVA47vja4eL0UVyW2wnwGUMAs4mdV.jpeg', NULL, 'Graceful-Sarees-TsP9b', 0.00, NULL, 0, NULL, NULL, '2020-12-07 15:25:46', '2020-12-07 15:25:46'),
(127, 'Fashionable Dress Material', 'seller', 35, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/l1Oz985u0JrV5BWbwzjDA2oMm7ilOp2zyFDuYRnP.jpeg\",\"uploads\\/products\\/photos\\/u3jsRp0I5fbmycVybM1nWgppCfWeA3wTRD1zLAZT.jpeg\",\"uploads\\/products\\/photos\\/Eo4DJeCPpahlfPJ3I3ZbB3VwLFCEfeeyp0mpOnoD.jpeg\",\"uploads\\/products\\/photos\\/2RSxNBaT9bRNLSv4pW93yxueF4PmolKTJhuvl490.jpeg\"]', 'uploads/products/thumbnail/XIBMgK4wDW8sI1O9YNjELZjYNA2Qcq9qq2v2uA0k.jpeg', 'youtube', NULL, 'Fashionable Dress Material', 'Beautiful Dress material&nbsp;', 780.00, 780.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 4, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Fashionable dress material', 'Catalog Name:*Trendy Fashionable Salwar Suits & Dress Materials*\r\nTop Fabric: Cotton Slub + Top Length: 2 Meters\r\nBottom Fabric: Cotton + Bottom Length: 2 Meters\r\nDupatta Fabric: Cotton Silk + Dupatta Length: 2.25 Meters\r\nLining Fabric: No Lining\r\nType: Un Stitched\r\nMultipack: Single\r\nDispatch:2-3 Days\r\nEasy Returns Available In Case Of Any Issue', 'uploads/products/meta/ti17md39LVI4qfQiUTSbhDHxxYqlBL1HDKk0T1ak.jpeg', NULL, 'Fashionable-Dress-Material-yihUD', 0.00, NULL, 0, NULL, NULL, '2020-12-07 15:32:19', '2020-12-07 15:32:19'),
(128, 'Elegant Jwellary set', 'seller', 35, 1, 2, 6, NULL, '[\"uploads\\/products\\/photos\\/Ob8cjlByXdY8RezKmKnsSu1nPpyV9N1vZ0Y2rXu7.jpeg\",\"uploads\\/products\\/photos\\/glDqorNCweod1vQktk3snAdlWZwhcAMmJsZZbQuH.jpeg\",\"uploads\\/products\\/photos\\/0fhUK35DRgH8BgiLTrNDRmJnLsRXNcyiRgs4SdVC.jpeg\",\"uploads\\/products\\/photos\\/l8XD0MqYgYB2QUwNNnEMfwwAkfn9kKXmrTIiDI4r.jpeg\",\"uploads\\/products\\/photos\\/EcfBA9XQhLSKBYK9gg4lR84F5SioaqIbIA8rMH9O.jpeg\"]', 'uploads/products/thumbnail/CleSbnCGxs1WPkRfSmAUBYnAyoefNCNeSElo1kgI.jpeg', 'youtube', NULL, 'Elegant Jwellary Sets', 'Elegant jwellary sets', 410.00, 410.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 5, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Elegant jwellary set', 'Catalog Name:*Elite Elegant Jewellery Sets*\r\nBase Metal: Alloy\r\nPlating: Gold Plated\r\nStone Type: Kundan\r\nSizing: Adjustable\r\nType: Necklace and Earrings\r\nMultipack: 1\r\nDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any Issue', 'uploads/products/meta/SJAeQVPr0EsmgGhIpva2Yilkh21rUT6F5k2FFisF.jpeg', NULL, 'Elegant-Jwellary-set-5Bbx2', 0.00, NULL, 0, NULL, NULL, '2020-12-07 15:37:35', '2020-12-07 15:37:35'),
(129, 'Cotton Dress material', 'seller', 35, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/gl0RVv6ROoMrEfmEMnU9gI3CWxcthSFzCWFEXXKC.jpeg\",\"uploads\\/products\\/photos\\/rSZCX4hX3ZeqWalsOfSS92lRzhFx4e8rJZvoskiy.jpeg\",\"uploads\\/products\\/photos\\/4l77eh3htzLZEDDt6EfmVIXg3lZ5JNvOMML4KoOK.jpeg\",\"uploads\\/products\\/photos\\/QuaFKUqF0RhQw6t48gZu6lTncgC5zDn48XwVm5Mb.jpeg\",\"uploads\\/products\\/photos\\/Q1hDnR2Fvg3sUXY2HGYjnBzq9kJQxh0MxNQ2xvU1.jpeg\",\"uploads\\/products\\/photos\\/jGPlLptauTMCSzUK3jX49j5Y9J5IRtoSFxKpOPzR.jpeg\",\"uploads\\/products\\/photos\\/y5eANJ9pb0oBeVQnhKKBapN2JoM5E4VlXYpkC5NL.jpeg\"]', 'uploads/products/thumbnail/ZIp51vlwXwAK3c8x7s4hCysbm0c9iHKYddupdo2m.jpeg', 'youtube', NULL, 'Catalog Name:*Abhisarika Sensational Salwar Suits & Dress', 'Festive Attractive Kasavu Suits &amp; Dress Material&nbsp;', 685.00, 685.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 5, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Cotton Dress Matirial', 'Catalog Name:*Abhisarika Sensational Salwar Suits & Dress Materials*\r\nTop Fabric: Cotton + Top Length: 2.5 Meters\r\nBottom Fabric: Cotton + Bottom Length: 2 Meters\r\nDupatta Fabric: Cotton Silk + Dupatta Length: 2.25 Meters\r\nLining Fabric: No lining\r\nType: Un Stitched\r\nPattern: Zari Woven\r\nMultipack: Single\r\nDispatch:2-3 Days', 'uploads/products/thumbnail/ZIp51vlwXwAK3c8x7s4hCysbm0c9iHKYddupdo2m.jpeg', NULL, 'Cotton-Dress-material-rqcCa', 0.00, NULL, 0, NULL, NULL, '2020-12-07 23:31:35', '2020-12-07 23:31:35'),
(130, 'Kutchhi Block Print Dupatta', 'seller', 35, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/oBBIAROKG7R0PFucppks7nBuKtNszCPdZoCkhPCo.jpeg\",\"uploads\\/products\\/photos\\/UC2IO9b6zjTGmCLX9MPbQTGQM6vxPWNHVbyKj29d.jpeg\",\"uploads\\/products\\/photos\\/XssZCs7uaGs7mc6Z1Rix0A4YMNBkv7q6kfhpgYSn.jpeg\",\"uploads\\/products\\/photos\\/j6PTKwy66DIU8g8PH1NYovqUIZBmULGc971zMekk.jpeg\",\"uploads\\/products\\/photos\\/ZGF9CE83CMqo7CKQjPE6jAFLeuBintSwkKeT38OS.jpeg\",\"uploads\\/products\\/photos\\/hXYk5ij9aD18VW1gHiBMIVpL4IKj7rpPwHngw7he.jpeg\",\"uploads\\/products\\/photos\\/WSJnJ4h5m4MORuluriRVNwuqZMoT4zTkoVTgMi0F.jpeg\"]', 'uploads/products/thumbnail/6QoGkFa9LAedD14icj3cHjdK534HAHWmIFyYr6sP.jpeg', 'youtube', NULL, 'Kutchhi Block Printed Dupatta', 'Kutchhi Block Printed Dupatta&nbsp;', 750.00, 750.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 6, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kutchhi Block Printed Dupatta', 'Kutchhi Block Printed Dupatta', 'uploads/products/meta/nElWqvVioJhNOXAqEEzB1KLvXwO8HxIAa4cARM8u.jpeg', NULL, 'Kutchhi-Block-Print-Dupatta-46We2', 0.00, NULL, 0, NULL, NULL, '2020-12-08 22:08:58', '2020-12-08 22:08:58'),
(131, 'Kutchhi Block Print Dupatta', 'seller', 35, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/WQolN5hz1VA9AvU8wl7hKepX1anSypK9sikoyfZg.jpeg\",\"uploads\\/products\\/photos\\/xV0s4M4KP8Rp6OyEfNtHnrJLKXu9ljPxG1PLGm7X.jpeg\",\"uploads\\/products\\/photos\\/xPvdoSwBSRMVLgIkDMhAUD3SCJkUhRvAZktWKGje.jpeg\",\"uploads\\/products\\/photos\\/KnBNWPWdzY98vkf0Fk2EHsIk7DaOl1qgzGgh8fKI.jpeg\",\"uploads\\/products\\/photos\\/w9FxTQF5bOt3n4DG8s6o98f1oOMmJqzcuh1FPkJf.jpeg\",\"uploads\\/products\\/photos\\/DMm58kcvZxFsMn1JBsUkSv3pTKWIwaK12y2oJCEp.jpeg\",\"uploads\\/products\\/photos\\/qSBrSsoKCqDQBJTTllZ90LlKOoTfBAtPKdnwKbFE.jpeg\"]', 'uploads/products/thumbnail/vVGWPf8kvPS6BxU56CjcpESjmqK5ciJfQcJYcxEt.jpeg', 'youtube', NULL, 'Kutchhi Block Printed Dupatta', 'Kutchhi Block Printed Dupatta&nbsp;', 750.00, 750.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 6, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kutchhi Block Printed Dupatta', 'Kutchhi Block Printed Dupatta', 'uploads/products/meta/YUOEuRR915sHC9uJxS3K7fRNUfefV1kBwGFyHUa8.jpeg', NULL, 'Kutchhi-Block-Print-Dupatta-7z7kh', 0.00, NULL, 0, NULL, NULL, '2020-12-08 22:09:00', '2020-12-08 22:09:00'),
(132, 'Kutchhi Block Print Dupatta', 'seller', 35, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/MarywIN53LQeoWh1v3RavTpWKmjkkLZI7Tc5Oc9r.jpeg\",\"uploads\\/products\\/photos\\/XaNFWzr4xPpRaW7bnnP7y2QqKoJBblDNc9BKYcdI.jpeg\",\"uploads\\/products\\/photos\\/AD7F4rXzweeZfAAZmYEhITbib8GD3zo5l6A6NqHu.jpeg\",\"uploads\\/products\\/photos\\/4W0eXKu5EQBCJQB6v82y4BYfIs97Lyxvg3DxmBZ8.jpeg\",\"uploads\\/products\\/photos\\/gWPLauIt3ePIWxfmWM1ltdu9dQSGjpgybY8Nh1T5.jpeg\",\"uploads\\/products\\/photos\\/nCOISL61hLJdbXOBby25IOkm9L1fZWyNZeP4pvoW.jpeg\",\"uploads\\/products\\/photos\\/kp6FDAlDpDFsjNw9W2yLQyzUXjgqlX5E8rDmRG0x.jpeg\"]', 'uploads/products/thumbnail/AiiL2zCHran8T6HkH0JV1AvPe6oLYMxBk3yy9VtU.jpeg', 'youtube', NULL, 'Kutchhi Block Printed Dupatta', 'Kutchhi Block Printed Dupatta&nbsp;', 750.00, 750.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 6, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kutchhi Block Printed Dupatta', 'Kutchhi Block Printed Dupatta', 'uploads/products/meta/a6wbqeTzt4mTJj91f71VdsdjMIdVAf0Yd41l58Ak.jpeg', NULL, 'Kutchhi-Block-Print-Dupatta-LeTjv', 0.00, NULL, 0, NULL, NULL, '2020-12-08 22:09:03', '2020-12-08 22:09:03'),
(134, 'Hoodies', 'seller', 22, 2, 16, NULL, NULL, '[\"uploads\\/products\\/photos\\/6lqj0YG9c0yLcPD3004E1sDVSE5zBxEvMdiwFbQt.jpeg\"]', 'uploads/products/thumbnail/3iqfte8Qt5yhlaO4quFUcadYZkrwqqpKlYXjstEl.jpeg', 'youtube', NULL, 'Hoodies', '<h1>Jack&amp;Jones original\r\nHoodies\r\nSize : S,M,L,XL,XXL<br></h1>', 1100.00, 1100.00, 1, '[]', '[]', '[\"#000000\",\"#0000FF\",\"#808080\",\"#008000\",\"#CD5C5C\",\"#FFFFFF\",\"#FFFF00\"]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Hoodies', 'Jack&Jones original\r\nHoodies\r\nSize : S,M,L,XL,XXL', 'uploads/products/meta/OSqxlnDQLvprM40cP69n1VyCY4YSmMfFLp2tcXv6.jpeg', NULL, 'Hoodies-dTosr', 0.00, NULL, 0, NULL, NULL, '2020-12-09 16:04:37', '2020-12-09 16:12:01'),
(135, 'Sweat tshirt', 'seller', 22, 2, 17, NULL, 15, '[\"uploads\\/products\\/photos\\/H1JZ3NlFVZH4e8o52swtljTDXQdd3dDFij01Zbtw.jpeg\"]', 'uploads/products/thumbnail/OivijkFoHru674RobZjmBxek6e1dDx8nfOIJUgqy.jpeg', 'youtube', NULL, 'Mens sweat tshirt', '<h2>Jack&amp;jones orginals\r\nSweat tshirt \r\nFull sleeves<br></h2>', 1100.00, 1100.00, 1, '[\"1\",\"3\"]', '[{\"attribute_id\":\"1\",\"values\":[\"L\"]},{\"attribute_id\":\"3\",\"values\":[\"Militory\"]}]', '[]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Jack&jones orginals', 'Jack&jones orginals\r\nSweat tshirt \r\nFull sleeves', 'uploads/products/meta/A1bOTG85ZqXCHsrKo1epcEBdRYiI8CVj2qQ1W73E.jpeg', NULL, 'Sweat-tshirt-O5xeL', 0.00, NULL, 0, NULL, NULL, '2020-12-09 16:09:54', '2020-12-09 16:10:58'),
(136, 'Beautiful Earrings', 'seller', 35, 1, 2, 6, NULL, '[\"uploads\\/products\\/photos\\/BAf1pLzmZYjPInCMc1oAwgPjvuow9UjqPMqKJcKJ.jpeg\",\"uploads\\/products\\/photos\\/eTVmoZayq3nCyoEvWqPLY1UhSVFd3foqNQwZ7TT9.jpeg\",\"uploads\\/products\\/photos\\/W6BP2Wzv2dqiDOLMyey6rgUza5BSRdvw6YlS4A6V.jpeg\",\"uploads\\/products\\/photos\\/Tpfl37is5aqLuKE7ifIVW2oKMz19CUIn9oOB79b3.jpeg\",\"uploads\\/products\\/photos\\/2NM7BkBh9iLBfpykusnXYDNQvbKC5BdTZaOPztJ1.jpeg\",\"uploads\\/products\\/photos\\/bksVCXGg5fJ8nrG6hsmZHr9PDBDy4gV7EC4gE5cR.jpeg\",\"uploads\\/products\\/photos\\/yyUdRqc9obLaKw9oShmJrU7JhhRtMgkUgLMfamcC.jpeg\"]', 'uploads/products/thumbnail/kXUP68rDxx0c0Nq4h6RvNlFVWPGPvrqY5DLpeZZq.jpeg', 'youtube', NULL, 'Beautiful Earrings', 'Beautiful Earrings&nbsp;', 290.00, 290.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 4, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Beautiful Earrings', 'Catalog Name:*Allure Chic Earrings*\r\nBase Metal: Alloy\r\nPlating: Silver Plated\r\nStone Type: Artificial Stones & Beads\r\nSizing: Non-Adjustable\r\nType: Drop Earrings\r\nMultipack: 1\r\nDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any Issue\r\nCash on Delivery', 'uploads/products/meta/9iKqZG5NLvKZeqflSOEIcNsLMUg1hvgTVy1VTQAC.jpeg', NULL, 'Beautiful-Earrings-N0fkM', 0.00, NULL, 0, NULL, NULL, '2020-12-09 17:48:30', '2020-12-09 17:48:30'),
(137, 'Fabulous Kurtis', 'seller', 35, 1, 1, 2, NULL, '[\"uploads\\/products\\/photos\\/VHLnQv9ryPYlDbKBpLp4o5X18kj6rOeEVWVn37dF.jpeg\",\"uploads\\/products\\/photos\\/QogYhvEYvvpPC8h7quA7QQ1LgzJkIwnpSqNWDqtq.jpeg\",\"uploads\\/products\\/photos\\/GlPZWR7OUbgjFtPXyztcfsxcIe3g6kzVrmeg2T7J.jpeg\",\"uploads\\/products\\/photos\\/qLKrheWVqqFYFeq4FbQv7OqqsZVQt5xnOBQwklpu.jpeg\",\"uploads\\/products\\/photos\\/TurafJsW5q4zOwvhbTYPJERGhrpUcHqDYZj7zZg4.jpeg\",\"uploads\\/products\\/photos\\/UJy3SSQBgHG2wL8LR4UFNhCF5AzUfFmyTkxf5iR1.jpeg\"]', 'uploads/products/thumbnail/mucu8jbvVn9obH1OtyMPla8ftlHhyWQiTTX94wG1.jpeg', 'youtube', NULL, 'Fabulous Krutis', 'Fabulous Combo&nbsp; Kurtis&nbsp;', 875.00, 875.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 5, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Fabulous Combo Kurtis', 'Catalog Name:*Aagyeyi Fabulous Kurtis*\r\nFabric: Rayon\r\nSleeve Length: Three-Quarter Sleeves\r\nPattern: Self-Design\r\nCombo of: Combo of 2\r\nSizes:\r\nXL, L, XXL\r\nDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any Issue\r\n*Proof of Safe Delivery! Click to know on Safety Standards of Delivery Partners- https://ltl.sh/y_nZrAV3', 'uploads/products/meta/wF92yNN5WCcXVkxt9xSljsn2NV4XJY3gTZC19t0f.jpeg', NULL, 'Fabulous-Kurtis-IEqXk', 0.00, NULL, 0, NULL, NULL, '2020-12-11 19:36:46', '2020-12-11 19:36:46'),
(138, 'Salwar  Suits and Dress materials', 'seller', 35, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/WSkM99IHY4ToaQ1RmlRfHU1KAVzCusoWAEXkmk8r.jpeg\",\"uploads\\/products\\/photos\\/EBYIOVTrQHiMIhUMJmDZ45zj61aH7XMwmuoJUt2m.jpeg\",\"uploads\\/products\\/photos\\/V0c29AFgGyfOMnFBYSmD0yv6h3QGnSKgl0kgB39V.jpeg\",\"uploads\\/products\\/photos\\/JwclilqJXknv7JQSaQAnxn2PQTpAH5foRQvarQeE.jpeg\",\"uploads\\/products\\/photos\\/Py9cbgZxCNmw9ElVAlvPkjc2ExbA3VaCpGNRcgX6.jpeg\",\"uploads\\/products\\/photos\\/yO5kggQGlCE0BwcyAp2BnzGxYtTIBuRprbuIxnVd.jpeg\"]', 'uploads/products/thumbnail/ugJX8vvjN7KzNpcNPzzDWgz3Btihncc7eRpptDPU.jpeg', 'youtube', NULL, 'Salwar Suits and dress materials', 'Salwar Suits and dress materials&nbsp;', 750.00, 750.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 6, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Salwar Suits and dress materials', 'Catalog Name:*Banita Sensational Suits & Dress Materials*\r\nTop Fabric: Cotton Slub + Top Length Size : 2.5 Meters\r\nBottom Fabric: Cotton  + Bottom Length Size : 2 Meters\r\nDupatta Fabric: Silk + Dupatta Length Size : 2.25 Meters\r\nMultipack: Single\r\nPattern : Printed\r\nType : Un Stitched\r\nDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any Issue', 'uploads/products/meta/JruByOlLWfggi1o6B6Pau1Rb6M1leAZ1XqhJduHO.jpeg', NULL, 'Salwar--Suits-and-Dress-materials-DlD8s', 0.00, NULL, 0, NULL, NULL, '2020-12-12 01:02:18', '2020-12-12 01:02:18'),
(139, 'Printed Rayon Kurtis', 'seller', 35, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/66RaFdB2W38FD6ixLpA1DSXD8xsDVwHuUlRR1LbD.jpeg\",\"uploads\\/products\\/photos\\/ZmwNImunjeUCYArzKJt5z8Vcxwo7zEj2KsX079Ly.jpeg\",\"uploads\\/products\\/photos\\/1dC51qPIUGC6LaEFLCiLxkRjK76jcq06HRpHgTgc.jpeg\",\"uploads\\/products\\/photos\\/naEqEeIWOeFP1e8LoiZ1IDgUShnMuWTeGzkMdrGD.jpeg\",\"uploads\\/products\\/photos\\/ssPJJJjgxlTNlnsd365l3vHaSSzCgUw7JhXKe1Kx.jpeg\",\"uploads\\/products\\/photos\\/oHXCQuH8yyiCEFmcMlyKHRyhTXIJDSReocFjcYEE.jpeg\",\"uploads\\/products\\/photos\\/6ubmBgqFBmxhF1elYJdTBg6JigfoUQXrVT4V49VN.jpeg\"]', 'uploads/products/thumbnail/ewe1e9YrZBRljw383gw9mWPG4FuZ7XbVjirkTilp.jpeg', 'youtube', NULL, 'Rayon Kurtis', 'Rayon Kurtis&nbsp;', 900.00, 900.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 6, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Rayon Kurtis', 'Catalog Name:*Aakarsha Attractive Kurtis*\r\nFabric: Rayon\r\nSleeve Length: Three-Quarter Sleeves\r\nCombo of: Single\r\nSizes:\r\nS (Bust Size: 36 in, Size Length: 52 in) \r\nXL (Bust Size: 42 in, Size Length: 52 in) \r\nL (Bust Size: 40 in, Size Length: 52 in) \r\nXXXL (Bust Size: 46 in, Size Length: 52 in) \r\nM (Bust Size: 38 in, Size Length: 52 in) \r\nXXL (Bust Size: 44 in, Size Length: 52 in)', 'uploads/products/meta/KoZCKFkLLisGz4cw6rSCOKp9npMEoMham5pDFTYs.jpeg', NULL, 'Printed-Rayon-Kurtis-cm2ld', 0.00, NULL, 0, NULL, NULL, '2020-12-12 01:08:41', '2020-12-12 01:08:41'),
(140, 'Unique Chopper', 'seller', 35, 3, 7, 19, NULL, '[\"uploads\\/products\\/photos\\/Iq695hJHyN8ZQbM4Y9uxqhuQC1krJM7f6AHWWonO.jpeg\",\"uploads\\/products\\/photos\\/wRUvSx2SSvZbFtRdHdauBle7JzfdMyozRhF3XQow.jpeg\",\"uploads\\/products\\/photos\\/Ojdd4GYb2NX7LW35cS63JMvbbT43Kn9TA59SPGEa.jpeg\",\"uploads\\/products\\/photos\\/TQGZ6J1nwa9khJpGAy00PVc7j3VZ3QcxqKWZIgsU.jpeg\",\"uploads\\/products\\/photos\\/zuShI8ixyRR9xWFpikiHKILQTtMUTkCFqckfWECK.jpeg\"]', 'uploads/products/thumbnail/7sGQDUp5yiL5JPC7ZCdBUABjRc6Np9axqdWpYhCF.jpeg', 'youtube', NULL, 'Unique Chopper', 'Unique Chopper&nbsp;', 450.00, 450.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 1, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Unique Chopper', 'Catalog Name:*Unique Chopper*\r\nSizes: \r\nFree Size\r\nDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any Issue\r\nCash on Delivery', 'uploads/products/meta/kaj7ekewvfRAFz4m1ePFBYBia4XdB7Obli0NTdaa.jpeg', NULL, 'Unique-Chopper-IpU4m', 0.00, NULL, 0, NULL, NULL, '2020-12-12 18:45:11', '2020-12-12 18:45:11'),
(141, 'Deep Fry  Stainer', 'seller', 35, 3, 7, 19, NULL, '[\"uploads\\/products\\/photos\\/cWDFVl5OMSrSuRPAEJI1BvaSVk3Sr47fAoCu6Uqa.jpeg\",\"uploads\\/products\\/photos\\/8VPZ9myYWvLatol1VicCRUZY4e6VVsurPiEhf35Z.jpeg\",\"uploads\\/products\\/photos\\/Wm646UwI1XFY7eKuRE1Z7exaGoXv64Yv2VVVRHoS.jpeg\",\"uploads\\/products\\/photos\\/DgimliJTCPR1HZjIByC4jbuKF7EtWDeTDwfnNJwH.jpeg\"]', 'uploads/products/thumbnail/rJAgoZBWaxxKnQtSaiezqB4DacfrfX9z9ZEOS9r5.jpeg', 'youtube', NULL, 'Deep Fry Stainer', 'Deep Fry Stainer&nbsp;', 450.00, 450.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 1, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Deep Fry Stainer', 'Catalog Name:*Graceful Deep Fry Stainer*\r\nMaterial: Stainless Steel\r\nPack: Variable (Product Dependent)\r\nlength: 10 Inch\r\nbreadth: 4 Inch\r\nheight: 4 Inch\r\nSizes: \r\nFree Size (Length Size: 10 in, Width Size: 5 in, Height Size: 5 in, Diameter Length Size: 5 in)', 'uploads/products/meta/9i1jjbBoWy9iZeErxZMUaM4JxwEPFkET1eF0yn1O.jpeg', NULL, 'Deep-Fry--Stainer-SfAyk', 0.00, NULL, 0, NULL, NULL, '2020-12-12 18:53:39', '2020-12-12 18:53:39'),
(142, 'Trendy Vegetable Mesher', 'seller', 35, 3, 7, 19, NULL, '[\"uploads\\/products\\/photos\\/H3OHVIQLivb95CR51UuQ2d8d7oSW3AgFjNp1OHeJ.jpeg\",\"uploads\\/products\\/photos\\/6l9g0LKRg6j4Nw03XWmobGCeuCkMlB3mGfwK1jVS.jpeg\",\"uploads\\/products\\/photos\\/Scb0CNK8SjqorteY4Y83OBa212sXnCfbAGKtRz1R.jpeg\"]', 'uploads/products/thumbnail/M4M9WATzEM0AlB4ivVtI5KiQKB3zSwTx2oZvPbg1.jpeg', 'youtube', NULL, 'Trendy Vegetables Mesher', 'Trendy Vegetables Mesher&nbsp;', 390.00, 390.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 1, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Trendy Vegetables Mesher', 'Catalog Name:*Trendy Vegetable Mashers*\r\nMaterial: Stainless Steel\r\nPack: Pack of 1\r\nSizes: \r\nFree Size (Length Size: 7 in, Width Size: 5 in) \r\n\r\nDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any Issue', 'uploads/products/thumbnail/M4M9WATzEM0AlB4ivVtI5KiQKB3zSwTx2oZvPbg1.jpeg', NULL, 'Trendy-Vegetable-Mesher-PdA21', 0.00, NULL, 0, NULL, NULL, '2020-12-12 18:57:31', '2020-12-12 18:57:31'),
(143, 'Elegant women Gowns', 'seller', 35, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/mxjDQROjbIiwbYfsyt7RGUY1rG8TkzOewTyiV4Ny.jpeg\",\"uploads\\/products\\/photos\\/TDoS6nQaNi89TilorcDNWloFtFwUwucBzmnNpd6b.jpeg\",\"uploads\\/products\\/photos\\/xSlUKB0ESG69BeoK9rpcdViGfAfY4NYV2aE7DlBf.jpeg\",\"uploads\\/products\\/photos\\/PGNUvH1cwARBzMrFmokmTyNyNQJ6bs1QIhtSZ6OL.jpeg\",\"uploads\\/products\\/photos\\/piEz7IqH5768UGEYLZwWt8u4hxOQaPxu65UHMdq7.jpeg\",\"uploads\\/products\\/photos\\/UAH2CWwm4qOQUR5uj0WzjXARJu9jfIRU5gr42JUq.jpeg\"]', 'uploads/products/thumbnail/eQmQDYicnt4iCiV1F2a5QbSaCeYvOuSUcXTyfXDm.jpeg', 'youtube', NULL, 'Elegant Women Gowns', 'Urban Fashionable Women\'s Gowns', 1550.00, 1550.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"L\",\"M\",\"XL\",\"XXL\"]}]', '[]', NULL, 0, 1, 1, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Elegant women Gowns', 'Catalog Name:*Classy Elegant Women Gowns*\r\nFabric: Cotton\r\nSizes:\r\nXL (Bust Size: 20 in, Length Size: 38 in) \r\nL (Bust Size: 17 in, Length Size: 38 in) \r\nM (Bust Size: 11 in, Length Size: 38 in) \r\nXXL (Bust Size: 29 in, Length Size: 38 in) \r\n\r\nDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any issues', 'uploads/products/thumbnail/eQmQDYicnt4iCiV1F2a5QbSaCeYvOuSUcXTyfXDm.jpeg', NULL, 'Elegant-women-Gowns-Uyq66', 0.00, NULL, 0, NULL, NULL, '2020-12-14 11:28:20', '2020-12-21 19:19:24'),
(144, 'Beautiful Earrings', 'seller', 35, 1, 2, 6, NULL, '[\"uploads\\/products\\/photos\\/RiPBhXbs5RvmzylGRDrDWvNSpDZmDCiHJ4vCGh3M.jpeg\",\"uploads\\/products\\/photos\\/e6jaesVQbB0hlpYMLjm1xizMP99eJEP1YiOR7qDJ.jpeg\",\"uploads\\/products\\/photos\\/DEjCvCD16rxRaNOSiGKvI9iJItpyOq6ZHXYnv6LG.jpeg\",\"uploads\\/products\\/photos\\/ACpDCNxsyBgXMNL8jUOn9eHvAtc37RBtzv7lY9xt.jpeg\",\"uploads\\/products\\/photos\\/FAiFvb4ktNpKQh6xr1PzxL1n6HXoKbYMbQQoRobH.jpeg\"]', 'uploads/products/thumbnail/636er6kZ8VcKwqvoovYYPf1pJ3i0XsvqIdNrxJ9b.jpeg', 'youtube', NULL, 'Beautiful Earrings', 'Stylish beautiful Earrings&nbsp;', 280.00, 280.00, 0, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"\"]}]', '[]', NULL, 0, 1, 0, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Beautiful Earrings', 'Catalog Name:*Twinkling Elegant Earrings*\r\nBase Metal: Alloy\r\nPlating: Variable (Product Dependent)\r\nStone Type: Artificial Beads\r\nSizing: Adjustable\r\nType: Drop Earrings\r\nMultipack: 1\r\nDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any Issue', 'uploads/products/meta/OoYvyUM4SA8lCzdw6DTQcV75cANusf97KnG5wiiK.jpeg', NULL, 'Beautiful-Earrings-qLp9w', 0.00, NULL, 0, NULL, NULL, '2020-12-14 12:37:10', '2020-12-14 12:37:10'),
(145, 'Kids  Play Toy sets', 'seller', 35, 4, 10, NULL, NULL, '[\"uploads\\/products\\/photos\\/Pk89QdolEC5KA51pcMwz9WOMWN002OoZsbNffswG.jpeg\",\"uploads\\/products\\/photos\\/nuMBfNZTKiZFHuwfdRvdZGZ3SYxbNIyfFffzToMu.jpeg\",\"uploads\\/products\\/photos\\/c8RpOkp45xmwA1CkPhQtaLDuuVlL0OFbwmZfubQP.jpeg\",\"uploads\\/products\\/photos\\/hePp3xmXl11Hfhbe0uepFI3ygdMN0MACkKML20Ax.jpeg\",\"uploads\\/products\\/photos\\/LVRww4byahWOOipPm55Uspnlp8tWEWTX7wVCjusz.jpeg\",\"uploads\\/products\\/photos\\/hzDUZEdzPeHottupRKkcnEkV4HDHKCgb9A25CmFL.jpeg\",\"uploads\\/products\\/photos\\/tYyIgK3FPx7vwVczXcUR4jzPvCmHnpHt5Zpj3Frg.jpeg\",\"uploads\\/products\\/photos\\/xhoEZxDaw5ZSDoHoB1lHIMfUnoylvnwIOJltTXJv.jpeg\",\"uploads\\/products\\/photos\\/Uf1Xu7e2ONM2asY4LEbD65MP1Pg3huC7PDbrzgG5.jpeg\"]', 'uploads/products/thumbnail/VUi77NzWL7veMy01FIL5NmMdZqZxghHeotmj8v02.jpeg', 'youtube', NULL, 'Kids Play Sets', 'Kids play Toys Sets&nbsp;', 364.00, 364.00, 0, '[]', '[]', '[]', NULL, 0, 1, 1, 1, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Kids Play Toys', 'Catalog Name:*Beautiful Unisex Soft Toys*\r\nMaterial: Velvet / Velour\r\nMultipack: 1\r\nSizes: \r\nFree Size\r\nDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any Issue', 'uploads/products/thumbnail/VUi77NzWL7veMy01FIL5NmMdZqZxghHeotmj8v02.jpeg', NULL, 'Kids--Play-Toy-sets-xN7Pf', 0.00, NULL, 0, NULL, NULL, '2020-12-15 11:06:51', '2020-12-21 19:19:19'),
(146, 'Rayon Kurtis', 'seller', 35, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/4S5v5k4pBe5dnnug34QacUC8JHT0X8NE7HZSXr1O.jpeg\",\"uploads\\/products\\/photos\\/SkO4zkrRxquLKx0ETqjM65K6vrhz3BHjq3VcfTkL.jpeg\",\"uploads\\/products\\/photos\\/EKakJkrUH55HdR5pF1QuvCRIbDAkVaq7fm7h9vOI.jpeg\",\"uploads\\/products\\/photos\\/oE8EIpXeu8SBLARaniIXOyPEDfTs3dzefU9tdmAH.jpeg\"]', 'uploads/products/thumbnail/o39WvqfOGbFZ0CJ6EZq5KO0dnCdyyFHqgI7KaXsq.jpeg', 'youtube', NULL, 'Rayon Kurtis', 'Rayon Kurtis&nbsp;', 600.00, 600.00, 0, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"\"]}]', '[]', NULL, 0, 1, 0, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Rayon Kurtis', 'Catalog Name:*Aagyeyi Refined Kurtis*\r\n\r\nFabric: Rayon\r\nSleeve Length: Three-Quarter Sleeves\r\nPattern: Solid\r\nCombo of: Single\r\n\"Sizes:\r\nS (Bust Size - 36 in , Length Size - 52 in)\r\nM (Bust Size - 38 in , Length Size - 52 in)\r\nL (Bust Size - 40 in , Length Size - 52 in)\r\nXL (Bust Size - 42 in , Length Size - 52 in)\r\nXXL (Bust Size - 44 in , Length Size - 52 in)\r\nXXXL (Bust Size - 46 in , Length Size - 52 in)\r\n4XL (Bust Size - 48 in , Length Size - 52 in)\r\n5XL (Bust Size - 50 in , Length Size - 52 in)\" \r\n\r\nDispatch: 4 - 5 Days\r\nDesign: 4\r\nEasy Returns Available In Case Of Any Issue', 'uploads/products/meta/LmLDRZwZDLrsmjHLFcSvFcpbL0CH87vPwJiyxWQH.jpeg', NULL, 'Rayon-Kurtis-q2Ocr', 0.00, NULL, 0, NULL, NULL, '2020-12-15 22:13:32', '2020-12-15 22:13:32'),
(147, 'Shirt', 'seller', 22, 2, 4, 12, 9, NULL, NULL, 'youtube', NULL, 'Parx orginal', 'Parx avenue shirt&nbsp;', 1.00, 1.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"\"]}]', '[\"#FF1493\"]', NULL, 0, 1, 0, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Parx', 'Parx avenue shirt', 'uploads/products/meta/EoYKuAfYPjHwa8KdNEbyk4RkHsgUa1GVtxViJvbd.jpeg', NULL, 'Shirt-4qNC0', 0.00, NULL, 0, NULL, NULL, '2020-12-17 15:43:31', '2020-12-17 15:43:31'),
(148, 'Cotton Kurta set', 'seller', 35, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/vYfZBkHktUxTENTGUCppbj1EqMU93HfoZTdOrG6V.jpeg\",\"uploads\\/products\\/photos\\/gBG5aFja9T8nhhhqytJVwuWvdD64UjIUKf9EsrUo.jpeg\",\"uploads\\/products\\/photos\\/sIG5yAlKTZfLs2HYm3L2Gq28yBfOrf6tudVFTbPK.jpeg\",\"uploads\\/products\\/photos\\/Dj4aRcfkgShed45or5b9k0NJ4v2FSdRkNsOeuVv3.jpeg\",\"uploads\\/products\\/photos\\/Gzl44DIA9HgjIjjtJX3wGAdtv3sVnGV3CEg6Isnb.jpeg\",\"uploads\\/products\\/photos\\/UlgGIxZvvOE9LXeEo9XzM5po4R5HNY3cC8OZ49q2.jpeg\"]', 'uploads/products/thumbnail/a0yqYhxIn1lGyIaCQVG3xpNcjZR5cd4RKfOESpA6.jpeg', 'youtube', NULL, 'Cotton Kurta set', 'Cotton&nbsp; Kurta set&nbsp;', 1000.00, 1000.00, 0, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"\"]}]', '[]', NULL, 0, 1, 0, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Cotton Kurta Set', '_This long printed colored Cotton Flex Kurtis and Palazzo Set is the perfect choice for a casual outing or a party. Look beautiful on the set._\r\n\r\nFabric: Kurti - Cotton Flex, Palazzo - Cotton Flex\r\n\r\nSleeves: 3/4th Sleeves Are Included\r\n\r\nSize: Kurti - XS-36 in, S-38 in, M-40 in, L -42 in, XL-44 in, XXL-46 in, 3XL-48 in, 4XL-50 in,  Palazzo: Up To 28 in To 36 in (Free Size)\r\n\r\nLength: Kurti: Up To 46 in / Palazzo: Up To 39 in\r\n\r\nType: Stitched\r\n\r\nDescription: It Has 1 Piece Of Kurti & 1 Piece Of Palazzo\r\n\r\nWork: Kurti: Solid / Palazzo: Printed\r\n\r\n\r\n\r\nDesigns: 7', 'uploads/products/thumbnail/a0yqYhxIn1lGyIaCQVG3xpNcjZR5cd4RKfOESpA6.jpeg', NULL, 'Cotton-Kurta-set-kNJ2r', 0.00, NULL, 0, NULL, NULL, '2020-12-18 16:05:11', '2020-12-18 16:05:11'),
(149, 'Cute Trendy Girls Sweaters', 'seller', 35, 4, 11, NULL, NULL, '[\"uploads\\/products\\/photos\\/JjJ0hlXWZWz3eFvr2K4hcb6BE5FwnwRIDMCPWt0M.jpeg\",\"uploads\\/products\\/photos\\/Isy0CUriAmnINf2ka2iSxlYsX7ytzf2fwYeyumoK.jpeg\"]', NULL, 'youtube', NULL, 'Beautiful Woolen Dress for Girls', '<p>Cute Trendy Girls Sweaters\r\n</p><p>\r\nFabric: Wool\r\nMultipack: 1\r\n</p><p>Sizes:</p><p> 0 to 6 months</p><p>\r\n6 to 12 Months</p><p>1 to 2 years</p><p>Dispatch: 2-3 Days</p>', 685.00, 685.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"0-6months\",\" 6-12months\",\" 1-2years\"]}]', '[]', NULL, 0, 1, 0, 1, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Girls Sweaters', 'Cute Trendy Girls Sweaters\r\n\r\nFabric: Wool\r\nMultipack: 1\r\nSizes: \r\n6-12 Months\r\nDispatch: 2-3 Days', 'uploads/products/meta/unwuPvzF6P4lJywMX6dgO7eLyrVrfR285bwHy3sI.jpeg', NULL, 'Cute-Trendy-Girls-Sweaters-iBTnN', 0.00, NULL, 0, NULL, NULL, '2020-12-19 09:09:21', '2020-12-19 09:09:21'),
(150, 'Batik Print Kurti', 'seller', 58, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/y9SkaffZPnw2aSPjzbWwXZZutrWlS34PjF1WHKUW.jpeg\",\"uploads\\/products\\/photos\\/W2UdzUervoElPXNZKyrIi3enA2YeSYAn0HoDROUn.jpeg\",\"uploads\\/products\\/photos\\/m1BH6IQ3LA0oWQNb2Ia2un3FOpyEGcLk0qNbfWOM.jpeg\",\"uploads\\/products\\/photos\\/FE3s2ht8Bb180YOpj90VwZmzid3bgx64Cvy7ZPvO.jpeg\",\"uploads\\/products\\/photos\\/QoOq4TPOphYcz0s1FKCe867dsk7s53VMSbGTSuEM.jpeg\"]', 'uploads/products/thumbnail/pxCgrYnYYz96yVUs75a8maW2mpQgOy3MJGAQlnkw.jpeg', 'youtube', NULL, '220', NULL, 220.00, 220.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 1, '5', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Batik Print Kurti', NULL, 'uploads/products/meta/whnvtCWuKqwpZBHFpQcoU53UiqBV0WhyH0OGpWOW.jpeg', NULL, 'Batik-Print-Kurti-9tVTk', 0.00, NULL, 0, NULL, NULL, '2020-12-19 12:12:42', '2020-12-19 13:01:29'),
(151, 'Plaza plazo and plaza pents', 'seller', 58, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/q8w4cEpJuRPSRn1qFMlV7E8cr4AwpE42eLG220Ex.jpeg\",\"uploads\\/products\\/photos\\/ANAuqNiuyHb1TXu4RkX7qo2F3cMEhKP1VGve75Vj.jpeg\",\"uploads\\/products\\/photos\\/Yd20F0WfjqVWV97DEiedjIMZu0tEj4r0JXvtfpgQ.jpeg\",\"uploads\\/products\\/photos\\/1UjyMW9oI4xoi5wEZvZ00WhEfo1AdpHaj9UJficB.jpeg\",\"uploads\\/products\\/photos\\/q68VuIQMdZaYJVLZGasjQH7316LkNABENZsVlyTB.jpeg\",\"uploads\\/products\\/photos\\/fJl8Y8wR1t8dymqGECatTOepkhbR8uvmNvHkNsRR.jpeg\",\"uploads\\/products\\/photos\\/jIeesZCCl1Q9W9lCFZOe4OTJSgWTzKSUZLQAGo8A.jpeg\",\"uploads\\/products\\/photos\\/xx8lsf4emQInQpnezOlhIIwUK7DFmqargakX8cg5.jpeg\",\"uploads\\/products\\/photos\\/PFQYKz2I9udy8kse2p6tNTyNRcDk6TX1qwcu1S3t.jpeg\",\"uploads\\/products\\/photos\\/ddoLlTl8lZQdsFxRaANm6Z8w6O3X3bjvHsObEFzX.jpeg\"]', 'uploads/products/thumbnail/jDfFAjV2at0hIRvrX0TgcmzBML0ikpNZNKghGNF3.jpeg', 'youtube', NULL, '220', NULL, 220.00, 220.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 1, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Plaza plazo and plaza pents', NULL, 'uploads/products/meta/Dzp9PtFHnkn1oUcqoKd1xATYnLSmJcEPW9FNXsWq.jpeg', NULL, 'Plaza-plazo-and-plaza-pents-XxwDa', 0.00, NULL, 0, NULL, NULL, '2020-12-19 12:35:32', '2020-12-19 13:03:05');
INSERT INTO `products` (`id`, `name`, `added_by`, `user_id`, `category_id`, `subcategory_id`, `subsubcategory_id`, `brand_id`, `photos`, `thumbnail_img`, `video_provider`, `video_link`, `tags`, `description`, `unit_price`, `purchase_price`, `variant_product`, `attributes`, `choice_options`, `colors`, `variations`, `todays_deal`, `published`, `featured`, `current_stock`, `unit`, `min_qty`, `discount`, `discount_type`, `tax`, `tax_type`, `shipping_type`, `shipping_cost`, `num_of_sale`, `meta_title`, `meta_description`, `meta_img`, `pdf`, `slug`, `rating`, `barcode`, `digital`, `file_name`, `file_path`, `created_at`, `updated_at`) VALUES
(152, 'Copper Glass', 'seller', 35, 3, 7, 19, NULL, '[\"uploads\\/products\\/photos\\/syhthf0J0YLLEP7ml9HupE3lq8wcJGba9FolfaiV.jpeg\",\"uploads\\/products\\/photos\\/ZAqff9bQa2kGO02DKDW5v251pULCCSAbBSHdHmUf.jpeg\",\"uploads\\/products\\/photos\\/9GVGz4YSW5BWWHFNVbaadol7yjJlWtZCC9dwp1Ib.jpeg\",\"uploads\\/products\\/photos\\/5Sda9uemyCLw5ynHgZ3N81FLsPvkwOZ9aG3nr3qo.jpeg\",\"uploads\\/products\\/photos\\/GytrKZNOJXBGTdmApY0KpuV08l3YUdHANqnrnPgb.jpeg\",\"uploads\\/products\\/photos\\/ZCfCZ9o8FYdKFV6QLVcijQhejcS5O489dneg7w3G.jpeg\",\"uploads\\/products\\/photos\\/tcQd1pS6SGfohCHUnALnfH0gKTpXxmhwzbCWxSXe.jpeg\"]', 'uploads/products/thumbnail/emVWBAfLPIEFUmt5OyGfryLo4xVw8iG5A2IF7q8D.jpeg', 'youtube', NULL, 'Copper Glass', 'Pure Copper glass 400 ML Jointless', 385.00, 385.00, 0, '[]', '[]', '[]', NULL, 0, 1, 1, 5, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Copper glass', 'I M Her King Pure Copper Glass 400 ML,Jointless,(Pack of 1)\r\n\r\n Color:  Copper\r\n\r\n Type:  Glassware & Drinkware\r\n\r\n Material:  Copper\r\n\r\nLength: 10.0 (in cm)\r\n\r\nWidth: 8.0 (in cm)\r\n\r\nHeight: 10.0 (in cm)\r\n\r\nCapacity: 400.0 (in ml)\r\n\r\nWithin 7-11 business days However, to find out an actual date of delivery, please enter your pin code.\r\n\r\n\"Short Description:- Weight with box:-250 Gm Approx Height of Glass: - 10cm Width (diameter) of Glass: - 7.5 cm Circle Measure of Glass: - 25 Cm Capacity: - 400 ML Material: - Copper In Pack: - 1 Glass BENEFITS-&gt; storing drinking water in a copper improve immune system, aid digestion, decrease wound healing times, and even boost the tan. EASY TO CLEAN-&gt; our copper Items are rust free, It has wide mouth thus making it extremely easy to clean. Just rinse with lemon water or Vinegar. IMPORTANT FACT-&gt; Copper changes color when it is exposed to air and moisture. This natural process is called Oxidation. This is a very beneficial process and keeps water fresh. Benefit of Copper: ----- Helps Kills Bacteria Helps with Weight Loss Regulates the Thyroid Function Cuts down Cancer Risks Regulates Melanin Production Helps Fight Anemia Prevents Digestive Disorders Boosts Cardiovascular Health Helps You Heal Faster Regulates Brain Function Reduces Arthritis Pain \"', 'uploads/products/meta/lu4zSzprCYjd9wppvcNzz5hxVXlsrMUN0kn4qfl6.jpeg', NULL, 'Copper-Glass-4xSis', 0.00, NULL, 0, NULL, NULL, '2020-12-20 00:13:45', '2020-12-21 19:19:11'),
(153, 'Rayon Kurtis', 'seller', 35, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/MlCV1sYtdPVB7PvEYF6V6cZcT38iAs6vniZI1SnF.jpeg\",\"uploads\\/products\\/photos\\/QUd2HMIYU0gn6wQjPrNqVySaPAIHXYG3GwIKjOg4.jpeg\",\"uploads\\/products\\/photos\\/lf8DKXl96Iay2H2IV1BAr1PrueywcaBZ9zjrSECA.jpeg\",\"uploads\\/products\\/photos\\/Heb9gCCJSRTyRbDMcfBtnXYw56AKgiXfU3llrIcq.jpeg\"]', 'uploads/products/thumbnail/p4n4crx9wjEyE68qI6mKXwHvBseJ9S3yx537eXH2.jpeg', 'youtube', NULL, 'Rayon Kurtis', 'Rayon Kurtis&nbsp;', 800.00, 800.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Rayon Kurtis', 'Catalog Name:*Charvi Pretty Kurtis*\r\nFabric: Rayon\r\nSleeve Length: Three-Quarter Sleeves\r\nPattern: Printed\r\nCombo of: Single\r\nSizes:\r\nXL (Bust Size: 42 in, Size Length: 49 in) L (Bust Size: 40 in, Size Length: 49 in) M (Bust Size: 38 in, Size Length: 49 in) XXL (Bust Size: 44 in, Size Length: 49 in) S (Bust Size: 36 in, Size Length: 49 in)\r\n\r\nEasy Returns Available In Case Of Any Issue\r\n*Proof of Safe Delivery! Click to know on Safety Standards of Delivery Partners- https://ltl.sh/y_nZrAV3', 'uploads/products/meta/vgjlddrgZH1slqIJpRF2qaBWb6xdVweAmk3qkjJD.jpeg', NULL, 'Rayon-Kurtis-GSOly', 0.00, NULL, 0, NULL, NULL, '2020-12-20 00:29:12', '2020-12-20 00:29:12'),
(154, 'Fashionable Kurti', 'seller', 35, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/JXp2xmiMrXba45Vh6DgWK0NMlLd4oMAxk62Vm1Rm.jpeg\",\"uploads\\/products\\/photos\\/grt5xtvMc145eWFXEAqhJ1wv6HgF6XotjurjSGkF.jpeg\",\"uploads\\/products\\/photos\\/mP7UacYACGTKJelW0IlRdpe8BHB1YDlUFyN4OnHt.jpeg\",\"uploads\\/products\\/photos\\/MSa4XvRCIAWGM7JXUe2WYRfRP3AWxNz9jYeulRym.jpeg\",\"uploads\\/products\\/photos\\/vk1r4CC8r2aHDiONp42KlrebpAWN3u2JUokQO5Da.jpeg\"]', 'uploads/products/thumbnail/r2Cr6egg1zjkN3Z03sGkOLBsHAmpZXixNhg5DuJo.jpeg', 'youtube', NULL, 'Fashionable Kurtis', 'Fashionable Kurtis&nbsp;', 1050.00, 1050.00, 0, '[]', '[]', '[]', NULL, 0, 1, 1, 6, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Fabulous  Kurtis', 'Catalog Name:*Chitrarekha Attractive Kurtis*\r\nFabric: Rayon\r\nSleeve Length: Three-Quarter Sleeves\r\nPattern: Printed\r\nCombo of: Single\r\nSizes:\r\nXL, L, XXL, M\r\nDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any Issue', 'uploads/products/meta/wNWM3D12pv6icW8WMeCOHXv6ynSaH4l60dBHVWhX.jpeg', NULL, 'Fashionable-Kurti-Jw7jD', 0.00, NULL, 0, NULL, NULL, '2020-12-20 00:35:14', '2020-12-21 19:19:03'),
(155, 'Denim Kurtis', 'seller', 35, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/zEJdKvVo87mNxKjwrlXIUtbPSoRCXpkvES72n1Yy.jpeg\",\"uploads\\/products\\/photos\\/CFM0qMJW8HqDudPL9SHZEgmgVRcWO8mlEWUYK0Gi.jpeg\",\"uploads\\/products\\/photos\\/7IcPslDYlABkd2t4paAArAOU9U8QP6YnsDsr1N6A.jpeg\"]', 'uploads/products/thumbnail/GZp5nduXvIus2Hnd6pWnNZI89Gb37M7cxmIEsukK.jpeg', 'youtube', NULL, 'Denim Kurtis', 'Denim Kurtis&nbsp;', 735.00, 735.00, 0, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"\"]}]', '[]', NULL, 0, 1, 1, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Denim kurtis', 'Abhisarika Drishya Kurtis\r\n\r\nFabric: Denim\r\nPattern: Solid\r\nCombo of: Single\r\nSizes:\r\nS (Bust Size: 36 in, Size Length: 45in)\r\nM (Bust Size: 38 in, Size Length: 45in)\r\nL (Bust Size: 40 in, Size Length: 45 in)\r\nXL (Bust Size: 42 in, Size Length: 45 in)\r\nXXL (Bust Size: 44 in, Size Length: 45 in)\r\n3XL (Bust Size: 46 in, Size Length: 45 in)\r\n4XL (Bust Size: 48in, Size Length: 45 in)\r\n5XL (Bust Size: 50 in, Size Length: 45 in)\r\nDispatch: 2-3 Days', 'uploads/products/thumbnail/GZp5nduXvIus2Hnd6pWnNZI89Gb37M7cxmIEsukK.jpeg', NULL, 'Denim-Kurtis-9mRdL', 0.00, NULL, 0, NULL, NULL, '2020-12-20 10:59:30', '2020-12-21 19:19:06'),
(156, 'Shoes', 'seller', 53, 5, 12, 31, NULL, '[\"uploads\\/products\\/photos\\/x7DPubiqviyulkPbS1cmnrnLv7TdP0LEnlfRBOfD.jpeg\",\"uploads\\/products\\/photos\\/8yoqYWO2Pa9zB95QzYfaWDdZyhG9GWi2dBsGD0es.jpeg\",\"uploads\\/products\\/photos\\/KGbQYVqCdh52AIDPtCCCFP7fbWmVcZOll95ATEH8.jpeg\",\"uploads\\/products\\/photos\\/Vh9uWIGpdA5Je6Xg1ZX7dUi928Lh7pdc9hnSwRzj.jpeg\"]', 'uploads/products/thumbnail/SBiZxFvf3qcD0zCLUYIrIa3faVC44R9oYEoLmbFq.jpeg', 'youtube', NULL, 'Men\'s shoes', '<ol><li><br></li></ol><br>', 850.00, 850.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"7\",\"8\",\"9\",\"10\"]}]', '[\"#000000\",\"#0000FF\",\"#808080\",\"#FF0000\"]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Men\'s Shoes', 'Size 7 8 9 10\r\n4 colour', 'uploads/products/meta/kb2SgnO2c0LubF7mUR7O80406zAdRGMYQpphQu9p.jpeg', NULL, 'Shoes-TfUdy', 0.00, NULL, 0, NULL, NULL, '2020-12-20 11:36:30', '2020-12-20 11:36:30'),
(157, 'Mashru Silk Kurti - Ajarakh Print', 'seller', 13, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/wRCUSaaE5C2qtUrb42q6d6vLR7wJAzcotBkgkoBR.jpeg\",\"uploads\\/products\\/photos\\/C1igOZx66KvlFsUc8lXZuB8a2kwIVPMmu7VA7BZb.jpeg\"]', 'uploads/products/thumbnail/U3vbz0MQ45HYRZd1K5L1TKjxHC47ZQSTem1Bm2lZ.jpeg', 'youtube', NULL, 'Mashru-silk', 'Mushru Silk Ajrakh Print Kutchi Kurti.&nbsp;', 1200.00, 1200.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"XL\"]}]', '[]', NULL, 1, 1, 1, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Mushru Silk Ajrakh Print Kurti', 'Mushru Silk Ajrakh print Kurti.', 'uploads/products/meta/u9eaduWDSamTyrkx6RtQlTm5gSXu6SWnFkT2P0IP.jpeg', NULL, 'Mashru-Silk-Kurti---Ajarakh-Print-vha85', 0.00, NULL, 0, NULL, NULL, '2020-12-21 19:17:20', '2020-12-21 19:18:55'),
(158, 'Beautiful Jwellary', 'seller', 35, 1, 2, 6, NULL, '[\"uploads\\/products\\/photos\\/3OIwM8Sto2oPBQEvI7O1FKts487eYlHhp7ghh0Xt.jpeg\"]', 'uploads/products/thumbnail/SY4AE0r3zQvLdouV73yBPIQNkb794JZAEtW6BuYB.jpeg', 'youtube', NULL, 'Beautiful Jwellary set', 'Beautiful Jwellary&nbsp;', 900.00, 900.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 2, '2', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Beautiful Jwellary', 'Catalog Name:*Sizzling Charming Women Necklaces & Chains*\r\nBase Metal: Brass & Copper\r\nPlating: Gold Plated\r\nStone Type: American Diamond\r\nSizing: Choker\r\nType: Necklace\r\nMultipack: 1\r\nSizes: Free Size\r\nDispatch: 2-3 Days\r\nEasy Returns Available In Case Of Any Issue\r\n*Proof of Safe Delivery! Click to know on Safety Standards of Delivery Partners- https://ltl.sh/y_nZrAV3', 'uploads/products/meta/r8NVCpVBiilc9g2Oa5s0FdxrSHJVeBJPp4YTEB4t.jpeg', NULL, 'Beautiful-Jwellary-JQ7Bp', 0.00, NULL, 0, NULL, NULL, '2020-12-23 09:03:45', '2020-12-23 09:14:24'),
(159, 'Jwellary combo set', 'seller', 35, 1, 2, 6, NULL, '[\"uploads\\/products\\/photos\\/ga2SFrP8v1mA3LusxAwaoo7Dgw91IVjCk66CigZf.jpeg\",\"uploads\\/products\\/photos\\/d4on2Flu1tsnTWlSyt6fh5jSZli3lEuCMXfPkshR.jpeg\",\"uploads\\/products\\/photos\\/lWcmKvCzaYYlS3oQb2qaCFMEBVekEFtetSsmMbr3.jpeg\",\"uploads\\/products\\/photos\\/IiSsfxzkcpKU9VY6UxpFtkX4w0oswqvgUh5et5NV.jpeg\"]', 'uploads/products/thumbnail/VH8xhg7q3dhCHE6Qg4ReQNTIy1XkOmTZeu6lJZag.jpeg', 'youtube', NULL, 'Jwellary combo set', 'Jwellary combo set&nbsp;', 600.00, 600.00, 0, '[]', '[]', '[]', NULL, 0, 1, 0, 4, '4', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Jwellary combo set', 'Catalog Name:*Allure Graceful Women Necklaces & Chains*\r\nBase Metal: Brass / Alloy\r\nPlating: Gold Plated\r\nStone Type: American Diamond / Artificial Stones\r\nSizing: Adjustable\r\nType: Necklace\r\nSizes: Free Size\r\nDispatch: 2-3 Days', 'uploads/products/meta/9lpxFh53OLKVSxKrv0br3QtdwwOQlSs6ZbNTlQr6.jpeg', NULL, 'Jwellary-combo-set-seBgp', 0.00, NULL, 0, NULL, NULL, '2020-12-23 09:13:49', '2020-12-23 09:13:49'),
(160, 'Rayon Kurtis', 'seller', 35, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/9qKsFWoGukUB0JKJ73gBYSL01vIglcS1uYkO5gw6.jpeg\",\"uploads\\/products\\/photos\\/mjiFOQt3tNrQ8uSdsYS0iXlicxNRk2MQ6yssXUeh.jpeg\",\"uploads\\/products\\/photos\\/u0G5m6JrW0XLJ7mhFG0CfW8qia2HNFl3qu9MB9gH.jpeg\",\"uploads\\/products\\/photos\\/nH7rk5qC62CN638qI5HUyPISBDmSCz5XWC3CHbaE.jpeg\",\"uploads\\/products\\/photos\\/Ne19GNWgndNDX4UgR9XJsgVtZbi1iMbGybtFdXBr.jpeg\",\"uploads\\/products\\/photos\\/bNFDjBXVMvD8dbHFvQ4UTZy2AbRHdmH5oIs8TMyI.jpeg\"]', 'uploads/products/thumbnail/D33ZhmtuRFWxAfwj6coh3xNqayHt38Jw9iAGYtfE.jpeg', 'youtube', NULL, 'Golden Printed A Line Kurtis', 'Rayon Foil Printed A-Line Women\'s Kurtas\r\n\r\nFabric: Rayon\r\nType: Stitched\r\nStyle: Foil Print\r\nDesign Type: A-Line\r\nSizes: XS (Bust 34.0 inches), S (Bust 36.0 inches), M (Bust 38.0 inches), L (Bust 40.0 inches), XL (Bust 42.0 inches), 2XL (Bust 44.0 inches), 3XL (Bust 46.0 inches), 4XL (Bust 48.0 inches)\r\nReturnWithin 7 days of delivery.&nbsp;', 580.00, 580.00, 0, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"\"]}]', '[]', NULL, 0, 1, 0, 0, '1', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Golden Printed Rayon Kurtis', 'Rayon Foil Printed A-Line Women\'s Kurtas\r\n\r\nFabric: Rayon\r\nType: Stitched\r\nStyle: Foil Print\r\nDesign Type: A-Line\r\nSizes: XS (Bust 34.0 inches), S (Bust 36.0 inches), M (Bust 38.0 inches), L (Bust 40.0 inches), XL (Bust 42.0 inches), 2XL (Bust 44.0 inches), 3XL (Bust 46.0 inches), 4XL (Bust 48.0 inches)', 'uploads/products/meta/V0tYisxOOsydO3HeQnv2LTpNmasHndksOeaFDRJG.jpeg', NULL, 'Rayon-Kurtis-Kzb8e', 0.00, NULL, 0, NULL, NULL, '2020-12-25 00:08:14', '2020-12-25 00:08:14'),
(161, 'Batik kurti', 'seller', 52, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/pt9CCoNahmRm3g8GESOgYKdNWQKB27s2ciirOYFB.jpeg\"]', 'uploads/products/thumbnail/jIeGVsvzQ07F2q6qUpOzHuRNPjnfaJFqDsc7pC8s.jpeg', 'youtube', NULL, 'Batik, kuttchi', NULL, 1000.00, 1000.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"42\"]}]', '[\"#0000FF\"]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Batik Kurti', 'Cotton\r\nBatik print\r\nKurti', 'uploads/products/meta/fjCbOTfQMza7ayZtVozBg3paV5195Qk2rafM8FEz.jpeg', NULL, 'Batik-kurti-G9dL6', 0.00, NULL, 0, NULL, NULL, '2020-12-29 19:17:02', '2020-12-29 19:17:02'),
(162, 'Batik kurti', 'seller', 52, 1, 1, 1, NULL, '[\"uploads\\/products\\/photos\\/2nbd2GtBarxVIsunZWkFYSh0wreSJcdAB0Jsbg38.jpeg\"]', 'uploads/products/thumbnail/QlGa7cKX7ozUYccWL44hs2O0XiXafPCSlLg6ByVn.jpeg', 'youtube', NULL, 'Batik, kuttchi', NULL, 1000.00, 1000.00, 1, '[\"1\"]', '[{\"attribute_id\":\"1\",\"values\":[\"42\"]}]', '[\"#0000FF\"]', NULL, 0, 1, 0, 0, 'Pc', 1, 0.00, 'amount', 0.00, 'amount', 'free', 0.00, 0, 'Batik Kurti', 'Cotton\r\nBatik print\r\nKurti', 'uploads/products/meta/eIn5GSX6ey9STOUeWegkyULMXaLE99ZfZq21j9Mu.jpeg', NULL, 'Batik-kurti-Jmhf0', 0.00, NULL, 0, NULL, NULL, '2020-12-29 19:17:05', '2020-12-29 19:17:05');

-- --------------------------------------------------------

--
-- Table structure for table `product_stocks`
--

CREATE TABLE `product_stocks` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `variant` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `sku` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `price` double(10,2) NOT NULL DEFAULT '0.00',
  `qty` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `product_stocks`
--

INSERT INTO `product_stocks` (`id`, `product_id`, `variant`, `sku`, `price`, `qty`, `created_at`, `updated_at`) VALUES
(7, 12, 'S', 'PCK-S', 1400.00, 8, '2020-11-16 15:58:34', '2020-11-19 22:30:36'),
(8, 12, 'M', 'PCK-M', 1400.00, 10, '2020-11-16 15:58:34', '2020-11-16 15:58:34'),
(9, 12, 'L', 'PCK-L', 1400.00, 9, '2020-11-16 15:58:34', '2020-11-17 09:42:58'),
(10, 12, 'XL', 'PCK-XL', 1400.00, 10, '2020-11-16 15:58:34', '2020-11-16 15:58:34'),
(11, 12, 'XXL', 'PCK-XXL', 1400.00, 10, '2020-11-16 15:58:34', '2020-11-16 15:58:34'),
(12, 6, 'Amethyst', 'Ww-Amethyst', 100.00, 10, '2020-11-19 22:10:39', '2020-11-19 22:10:39'),
(13, 6, 'Aqua', 'Ww-Aqua', 100.00, 10, '2020-11-19 22:10:39', '2020-11-19 22:10:39'),
(14, 3, 'M', 'SCS3PBBSUwALGaSRP-M', 120.00, 10, '2020-11-19 22:18:54', '2020-11-19 22:18:54'),
(15, 3, 'L', 'SCS3PBBSUwALGaSRP-L', 120.00, 10, '2020-11-19 22:18:54', '2020-11-19 22:18:54'),
(16, 3, 'XL', 'SCS3PBBSUwALGaSRP-XL', 120.00, 10, '2020-11-19 22:18:54', '2020-11-19 22:18:54'),
(17, 3, 'XXL', 'SCS3PBBSUwALGaSRP-XXL', 120.00, 10, '2020-11-19 22:18:54', '2020-11-19 22:18:54'),
(18, 13, 'Blue-34', 'SFJ-Blue-34', 1499.00, 0, '2020-11-21 16:33:00', '2020-11-22 21:54:28'),
(19, 13, 'Blue-36', 'SFJ-Blue-36', 1499.00, 2, '2020-11-21 16:33:00', '2020-11-21 16:33:00'),
(20, 13, 'Blue-38', 'SFJ-Blue-38', 1499.00, 2, '2020-11-21 16:33:00', '2020-11-21 16:33:00'),
(21, 13, 'DarkBlue-34', 'SFJ-DarkBlue-34', 1499.00, 2, '2020-11-21 16:33:00', '2020-11-21 16:33:00'),
(22, 13, 'DarkBlue-36', 'SFJ-DarkBlue-36', 1499.00, 2, '2020-11-21 16:33:00', '2020-11-21 16:33:00'),
(23, 13, 'DarkBlue-38', 'SFJ-DarkBlue-38', 1499.00, 2, '2020-11-21 16:33:00', '2020-11-21 16:33:00'),
(24, 13, 'DarkGray-34', 'SFJ-DarkGray-34', 1499.00, 2, '2020-11-21 16:33:00', '2020-11-21 16:33:00'),
(25, 13, 'DarkGray-36', 'SFJ-DarkGray-36', 1499.00, 2, '2020-11-21 16:33:00', '2020-11-21 16:33:00'),
(26, 13, 'DarkGray-38', 'SFJ-DarkGray-38', 1499.00, 2, '2020-11-21 16:33:00', '2020-11-21 16:33:00'),
(29, 15, 'LightCyan-M', 'TP-LightCyan-M', 719.00, 1, '2020-11-23 12:10:09', '2020-11-23 17:17:26'),
(30, 15, 'LightCyan-L', 'TP-LightCyan-L', 719.00, 1, '2020-11-23 12:10:09', '2020-11-23 17:17:27'),
(31, 15, 'LightCyan-XL', 'TP-LightCyan-XL', 719.00, 1, '2020-11-23 12:10:09', '2020-11-23 17:17:27'),
(32, 15, 'LightGrey-M', 'TP-LightGrey-M', 719.00, 1, '2020-11-23 12:10:09', '2020-11-23 17:17:27'),
(33, 15, 'LightGrey-L', 'TP-LightGrey-L', 719.00, 1, '2020-11-23 12:10:09', '2020-11-23 17:17:27'),
(34, 15, 'LightGrey-XL', 'TP-LightGrey-XL', 719.00, 1, '2020-11-23 12:10:09', '2020-11-23 17:17:27'),
(35, 16, 'Black-M', 'RSHPS-Black-M', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(36, 16, 'Black-L', 'RSHPS-Black-L', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(37, 16, 'Black-XL', 'RSHPS-Black-XL', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(38, 16, 'Black-XXL', 'RSHPS-Black-XXL', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(39, 16, 'Brown-M', 'RSHPS-Brown-M', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(40, 16, 'Brown-L', 'RSHPS-Brown-L', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(41, 16, 'Brown-XL', 'RSHPS-Brown-XL', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(42, 16, 'Brown-XXL', 'RSHPS-Brown-XXL', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(43, 16, 'DarkRed-M', 'RSHPS-DarkRed-M', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(44, 16, 'DarkRed-L', 'RSHPS-DarkRed-L', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(45, 16, 'DarkRed-XL', 'RSHPS-DarkRed-XL', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(46, 16, 'DarkRed-XXL', 'RSHPS-DarkRed-XXL', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(47, 16, 'Gray-M', 'RSHPS-Gray-M', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(48, 16, 'Gray-L', 'RSHPS-Gray-L', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(49, 16, 'Gray-XL', 'RSHPS-Gray-XL', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(50, 16, 'Gray-XXL', 'RSHPS-Gray-XXL', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(51, 16, 'MintCream-M', 'RSHPS-MintCream-M', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(52, 16, 'MintCream-L', 'RSHPS-MintCream-L', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(53, 16, 'MintCream-XL', 'RSHPS-MintCream-XL', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(54, 16, 'MintCream-XXL', 'RSHPS-MintCream-XXL', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(55, 16, 'Pink-M', 'RSHPS-Pink-M', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(56, 16, 'Pink-L', 'RSHPS-Pink-L', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(57, 16, 'Pink-XL', 'RSHPS-Pink-XL', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(58, 16, 'Pink-XXL', 'RSHPS-Pink-XXL', 835.00, 2, '2020-11-23 15:40:46', '2020-11-23 15:40:46'),
(59, 17, 'DarkGray-M', 'RSZ-DarkGray-M', 1200.00, 1, '2020-11-23 17:16:46', '2020-11-23 17:18:17'),
(60, 17, 'DarkGray-L', 'RSZ-DarkGray-L', 1200.00, 1, '2020-11-23 17:16:46', '2020-11-23 17:18:17'),
(61, 17, 'DarkGray-XL', 'RSZ-DarkGray-XL', 1200.00, 1, '2020-11-23 17:16:46', '2020-11-23 17:18:17'),
(62, 18, 'DarkBlue', 'Ts-DarkBlue', 699.00, 4, '2020-11-23 17:38:09', '2020-11-23 17:38:09'),
(77, 44, '38-Rayon', 'K-38-Rayon', 1049.00, 1, '2020-11-27 14:21:06', '2020-11-27 14:21:06'),
(117, 46, '44', 'K-44', 899.00, 1, '2020-11-29 13:47:10', '2020-11-29 23:42:01'),
(118, 45, 'S', 'K-S', 1099.00, 1, '2020-11-29 13:47:26', '2020-11-29 23:42:29'),
(119, 45, 'M', 'K-M', 1099.00, 1, '2020-11-29 13:47:26', '2020-11-29 23:42:29'),
(120, 45, 'XXL', 'K-XXL', 1099.00, 1, '2020-11-29 13:47:26', '2020-11-29 23:42:29'),
(121, 43, '40', 'K-40', 1099.00, 1, '2020-11-29 13:47:49', '2020-11-29 23:42:57'),
(122, 43, '42', 'K-42', 1099.00, 1, '2020-11-29 13:47:49', '2020-11-29 23:42:57'),
(127, 41, '38-BottleGreen', 'K-38-BottleGreen', 1199.00, 1, '2020-11-29 13:49:43', '2020-11-29 23:44:06'),
(128, 41, '40-BottleGreen', 'K-40-BottleGreen', 1199.00, 1, '2020-11-29 13:49:43', '2020-11-29 23:44:06'),
(129, 41, '42-BottleGreen', 'K-42-BottleGreen', 1199.00, 1, '2020-11-29 13:49:43', '2020-11-29 23:44:06'),
(130, 41, '44-BottleGreen', 'K-44-BottleGreen', 1199.00, 1, '2020-11-29 13:49:43', '2020-11-29 23:44:06'),
(131, 40, '38', 'K-38', 1549.00, 1, '2020-11-29 13:50:10', '2020-11-29 23:44:48'),
(132, 40, '40', 'K-40', 1549.00, 1, '2020-11-29 13:50:10', '2020-11-29 23:44:48'),
(133, 40, '42', 'K-42', 1549.00, 1, '2020-11-29 13:50:10', '2020-11-29 23:44:48'),
(134, 40, '44', 'K-44', 1549.00, 1, '2020-11-29 13:50:10', '2020-11-29 23:44:48'),
(135, 39, '38', 'K-38', 1349.00, 1, '2020-11-29 13:50:31', '2020-11-29 23:45:31'),
(136, 39, '40', 'K-40', 1349.00, 1, '2020-11-29 13:50:31', '2020-11-29 23:45:31'),
(137, 39, '42', 'K-42', 1349.00, 1, '2020-11-29 13:50:31', '2020-11-29 23:45:31'),
(138, 39, '44', 'K-44', 1349.00, 1, '2020-11-29 13:50:31', '2020-11-29 23:45:31'),
(139, 38, '38', 'K-38', 1449.00, 1, '2020-11-29 13:50:56', '2020-11-29 23:46:15'),
(140, 38, '40', 'K-40', 1449.00, 1, '2020-11-29 13:50:56', '2020-11-29 23:46:15'),
(141, 38, '42', 'K-42', 1449.00, 1, '2020-11-29 13:50:56', '2020-11-29 23:46:15'),
(142, 38, '44', 'K-44', 1449.00, 1, '2020-11-29 13:50:56', '2020-11-29 23:46:15'),
(143, 37, '38', 'K-38', 1349.00, 1, '2020-11-29 13:51:19', '2020-11-29 23:46:58'),
(144, 37, '40', 'K-40', 1349.00, 1, '2020-11-29 13:51:19', '2020-11-29 23:46:58'),
(145, 37, '42', 'K-42', 1349.00, 1, '2020-11-29 13:51:19', '2020-11-29 23:46:58'),
(146, 37, '44', 'K-44', 1349.00, 1, '2020-11-29 13:51:19', '2020-11-29 23:46:58'),
(147, 36, '40', 'K-40', 999.00, 1, '2020-11-29 13:51:46', '2020-11-29 23:47:34'),
(148, 36, '42', 'K-42', 999.00, 1, '2020-11-29 13:51:46', '2020-11-29 23:47:34'),
(149, 36, '44', 'K-44', 999.00, 1, '2020-11-29 13:51:46', '2020-11-29 23:47:34'),
(150, 35, 'L', 'K-L', 1499.00, 1, '2020-11-29 13:52:16', '2020-11-29 23:48:04'),
(151, 34, 'XL', 'K-XL', 1599.00, 1, '2020-11-29 13:52:38', '2020-11-29 23:48:52'),
(152, 34, 'XXL', 'K-XXL', 1599.00, 1, '2020-11-29 13:52:38', '2020-11-29 23:48:52'),
(153, 33, '40-MultiColor', 'K-40-MultiColor', 1199.00, 1, '2020-11-29 13:53:02', '2020-11-29 23:49:21'),
(154, 33, '42-MultiColor', 'K-42-MultiColor', 1199.00, 1, '2020-11-29 13:53:02', '2020-11-29 23:49:21'),
(155, 32, 'M', 'K-M', 1199.00, 1, '2020-11-29 13:53:23', '2020-11-29 23:49:54'),
(156, 32, 'L', 'K-L', 1199.00, 1, '2020-11-29 13:53:23', '2020-11-29 23:49:54'),
(157, 32, 'XXL', 'K-XXL', 1199.00, 1, '2020-11-29 13:53:23', '2020-11-29 23:49:54'),
(158, 31, '40', 'K-40', 1049.00, 1, '2020-11-29 13:53:47', '2020-11-29 23:50:20'),
(159, 31, '42', 'K-42', 1049.00, 1, '2020-11-29 13:53:47', '2020-11-29 23:50:20'),
(160, 26, '44', 'K-44', 999.00, 1, '2020-11-29 13:54:57', '2020-11-29 23:50:56'),
(161, 25, '44', 'K-44', 999.00, 1, '2020-11-29 13:55:30', '2020-11-29 23:51:25'),
(162, 24, '44', 'K-44', 999.00, 1, '2020-11-29 13:55:57', '2020-11-29 23:51:50'),
(163, 23, '38', 'K-38', 1250.00, 1, '2020-11-29 13:56:19', '2020-11-29 23:52:22'),
(164, 23, '40', 'K-40', 1250.00, 1, '2020-11-29 13:56:19', '2020-11-29 23:52:22'),
(165, 23, '42', 'K-42', 1250.00, 1, '2020-11-29 13:56:19', '2020-11-29 23:52:22'),
(166, 23, '44', 'K-44', 1250.00, 1, '2020-11-29 13:56:19', '2020-11-29 23:52:22'),
(167, 22, '38', 'K-38', 799.00, 1, '2020-11-29 13:56:41', '2020-11-29 23:53:05'),
(168, 21, '46', 'BK-46', 996.00, 1, '2020-11-29 13:57:08', '2020-11-29 23:53:34'),
(169, 20, '44', 'P-44', 1599.00, 1, '2020-11-29 13:57:30', '2020-11-29 23:54:01'),
(170, 49, 'Blue-30', 'CD-Blue-30', 600.00, 1, '2020-11-29 23:03:26', '2020-11-29 23:03:26'),
(171, 50, 'Black-30', 'CD-Black-30', 649.00, 1, '2020-11-29 23:07:06', '2020-11-29 23:07:06'),
(172, 51, 'Gray-30', 'SCT-Gray-30', 599.00, 1, '2020-11-29 23:12:47', '2020-11-29 23:12:47'),
(173, 52, 'Black-30', 'SCT-Black-30', 599.00, 1, '2020-11-29 23:16:18', '2020-11-29 23:16:18'),
(174, 53, 'CornflowerBlue-40', 'PT-CornflowerBlue-40', 449.00, 1, '2020-11-29 23:23:55', '2020-11-29 23:23:55'),
(175, 54, 'Orange-38', 'MST-Orange-38', 479.00, 1, '2020-11-29 23:28:12', '2020-11-29 23:28:12'),
(176, 55, 'Gray-38', 'CST-Gray-38', 299.00, 1, '2020-11-29 23:33:02', '2020-11-29 23:33:02'),
(177, 56, 'DimGray-38', 'CST-DimGray-38', 299.00, 1, '2020-11-29 23:36:54', '2020-11-29 23:36:54'),
(178, 57, 'Black-38', 'CPS-Black-38', 549.00, 1, '2020-11-29 23:41:33', '2020-11-29 23:41:33'),
(179, 42, 'Lemon-38', 'K-Lemon-38', 1349.00, 1, '2020-11-29 23:43:30', '2020-11-29 23:43:30'),
(180, 42, 'Lemon-40', 'K-Lemon-40', 1349.00, 1, '2020-11-29 23:43:30', '2020-11-29 23:43:30'),
(181, 42, 'Lemon-42', 'K-Lemon-42', 1349.00, 1, '2020-11-29 23:43:30', '2020-11-29 23:43:30'),
(182, 42, 'Lemon-44', 'K-Lemon-44', 1349.00, 1, '2020-11-29 23:43:30', '2020-11-29 23:43:30'),
(183, 66, 'XL', 'RK-XL', 800.00, 10, '2020-12-01 22:31:17', '2020-12-01 22:31:17'),
(184, 66, 'S', 'RK-S', 800.00, 10, '2020-12-01 22:31:17', '2020-12-01 22:31:17'),
(185, 66, 'M', 'RK-M', 800.00, 10, '2020-12-01 22:31:17', '2020-12-01 22:31:17'),
(186, 66, 'XXL', 'RK-XXL', 800.00, 10, '2020-12-01 22:31:17', '2020-12-01 22:31:17'),
(187, 72, 'Red-Cotton', 'BS/P/ST-Red-Cotton', 441.00, 1, '2020-12-02 17:29:35', '2020-12-02 17:29:35'),
(188, 73, 'Yellow-Cotton', 'BST-Yellow-Cotton', 441.00, 1, '2020-12-02 17:37:19', '2020-12-02 17:37:19'),
(189, 74, 'Cotton', 'BSST-Cotton', 416.00, 1, '2020-12-02 17:41:50', '2020-12-02 17:41:50'),
(190, 75, 'Cotton', 'BSST-Cotton', 416.00, 1, '2020-12-02 17:45:33', '2020-12-02 17:45:33'),
(191, 76, 'Cotton', 'BSST-Cotton', 416.00, 1, '2020-12-02 17:47:54', '2020-12-02 17:47:54'),
(192, 77, 'Cotton', 'BSST-Cotton', 416.00, 1, '2020-12-02 17:49:20', '2020-12-02 17:49:20'),
(193, 78, 'Cotton', 'BSST-Cotton', 416.00, 1, '2020-12-02 17:50:56', '2020-12-02 17:50:56'),
(194, 79, 'Polycotton', 'KPCW-Polycotton', 89.00, 1, '2020-12-02 18:38:34', '2020-12-02 18:38:34'),
(195, 92, 'DeepPink-L', 'MWKRP-DeepPink-L', 1099.00, 1, '2020-12-04 23:59:19', '2020-12-05 00:00:21'),
(196, 93, 'HotPink-L', 'JSPKwTW-HotPink-L', 799.00, 1, '2020-12-05 00:08:39', '2020-12-05 00:08:39'),
(197, 93, 'HotPink-M', 'JSPKwTW-HotPink-M', 799.00, 1, '2020-12-05 00:08:39', '2020-12-05 00:08:39'),
(198, 94, 'Yellow-XL', 'YPCKwMW-Yellow-XL', 999.00, 1, '2020-12-05 00:15:35', '2020-12-05 00:15:35'),
(199, 95, 'DarkSlateBlue-XL', 'LSK-DarkSlateBlue-XL', 1299.00, 1, '2020-12-05 00:20:02', '2020-12-05 00:20:02'),
(200, 96, 'Yellow-XL', 'LYCKwPW-Yellow-XL', 1099.00, 1, '2020-12-05 00:27:51', '2020-12-05 00:27:51'),
(201, 97, 'L', 'SCK-L', 699.00, 1, '2020-12-05 00:33:32', '2020-12-05 00:34:12'),
(202, 98, 'PeachPuff-L', 'PCSK-PeachPuff-L', 699.00, 1, '2020-12-05 00:39:56', '2020-12-05 11:28:04'),
(203, 98, 'PeachPuff-M', 'PCSK-PeachPuff-M', 699.00, 1, '2020-12-05 00:40:43', '2020-12-05 11:28:04'),
(204, 99, 'XL', 'FPCKWSB-XL', 999.00, 1, '2020-12-05 00:45:38', '2020-12-05 00:45:38'),
(205, 100, 'Green-L', 'BGCSPKwBN-Green-L', 799.00, 1, '2020-12-05 00:52:39', '2020-12-05 00:52:39'),
(206, 101, 'XL', 'MGFSK-XL', 799.00, 1, '2020-12-05 00:56:40', '2020-12-05 00:56:40'),
(207, 102, 'L', 'PPKwFhW-L', 1199.00, 1, '2020-12-05 01:04:28', '2020-12-05 01:04:28'),
(208, 103, 'HotPink-L', 'SFPCKPSwUaDP-HotPink-L', 1599.00, 1, '2020-12-05 01:14:42', '2020-12-05 01:14:42'),
(209, 103, 'SlateBlue-L', 'SFPCKPSwUaDP-SlateBlue-L', 1599.00, 1, '2020-12-05 01:14:42', '2020-12-05 01:14:42'),
(210, 104, 'XL', 'WaBCKwFMWAT-XL', 999.00, 1, '2020-12-05 01:24:58', '2020-12-05 10:39:17'),
(211, 105, 'L', 'SBLPCKwMW-L', 1099.00, 1, '2020-12-05 01:36:28', '2020-12-05 01:36:28'),
(212, 106, 'L', 'YCKwFHW-L', 999.00, 1, '2020-12-05 01:40:16', '2020-12-05 01:40:16'),
(213, 107, 'L', 'BGASACKwMW-L', 1199.00, 1, '2020-12-05 01:47:37', '2020-12-05 01:48:05'),
(214, 108, 'L', 'MCCKwPHW-L', 899.00, 1, '2020-12-05 01:51:06', '2020-12-05 01:51:06'),
(215, 109, 'XL', 'NBPCKwHW-XL', 1099.00, 1, '2020-12-05 01:57:35', '2020-12-05 01:57:35'),
(216, 110, 'L', 'MCAPASK-L', 799.00, 1, '2020-12-05 02:05:26', '2020-12-05 02:05:26'),
(217, 111, 'XL', 'BCKwHW-XL', 699.00, 1, '2020-12-05 02:08:48', '2020-12-05 02:08:48'),
(218, 112, 'L', 'SBCKwMW-L', 899.00, 1, '2020-12-05 02:13:56', '2020-12-05 02:13:56'),
(219, 113, 'XL', 'MCK-XL', 899.00, 1, '2020-12-05 02:17:39', '2020-12-05 02:17:39'),
(220, 114, 'DarkSeaGreen-Georgette', 'AS-DarkSeaGreen-Georgette', 3737.00, 1, '2020-12-06 13:06:26', '2020-12-07 05:51:45'),
(221, 115, 'Blue-Jacquard', 'BSSWULC-Blue-Jacquard', 1728.00, 1, '2020-12-06 13:13:47', '2020-12-06 13:14:42'),
(222, 116, 'Orange-L-Georgette', 'LAS-Orange-L-Georgette', 3636.00, 1, '2020-12-06 13:19:37', '2020-12-06 13:19:37'),
(223, 117, 'Silk-Green+Blue', 'RSELCwD-Silk-Green+Blue', 8487.00, 1, '2020-12-06 13:25:49', '2020-12-06 13:25:49'),
(224, 118, 'LightBlue-42-Rayon', 'RESKwP-LightBlue-42-Rayon', 1349.00, 1, '2020-12-06 20:20:29', '2020-12-06 20:20:29'),
(225, 118, 'LightBlue-44-Rayon', 'RESKwP-LightBlue-44-Rayon', 1349.00, 1, '2020-12-06 20:20:29', '2020-12-06 20:20:29'),
(226, 119, 'GreenYellow-38-Rayon', 'REKwP-GreenYellow-38-Rayon', 899.00, 1, '2020-12-06 20:26:06', '2020-12-06 20:26:06'),
(227, 119, 'GreenYellow-40-Rayon', 'REKwP-GreenYellow-40-Rayon', 899.00, 1, '2020-12-06 20:26:06', '2020-12-06 20:26:06'),
(228, 119, 'GreenYellow-42-Rayon', 'REKwP-GreenYellow-42-Rayon', 899.00, 1, '2020-12-06 20:26:06', '2020-12-06 20:26:06'),
(229, 119, 'GreenYellow-44-Rayon', 'REKwP-GreenYellow-44-Rayon', 899.00, 1, '2020-12-06 20:26:06', '2020-12-06 20:26:06'),
(230, 133, 'Blue-S', 'H-Blue-S', 1100.00, 1, '2020-12-09 15:55:22', '2020-12-09 15:59:34'),
(231, 133, 'Blue-M', 'H-Blue-M', 1100.00, 1, '2020-12-09 15:55:22', '2020-12-09 15:59:34'),
(232, 133, 'Blue-L', 'H-Blue-L', 1100.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:59:34'),
(233, 133, 'Blue-XL', 'H-Blue-XL', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(234, 133, 'Blue-XXL', 'H-Blue-XXL', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(235, 133, 'Gray-S', 'H-Gray-S', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(236, 133, 'Gray-M', 'H-Gray-M', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(237, 133, 'Gray-L', 'H-Gray-L', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(238, 133, 'Gray-XL', 'H-Gray-XL', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(239, 133, 'Gray-XXL', 'H-Gray-XXL', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(240, 133, 'Green-S', 'H-Green-S', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(241, 133, 'Green-M', 'H-Green-M', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(242, 133, 'Green-L', 'H-Green-L', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(243, 133, 'Green-XL', 'H-Green-XL', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(244, 133, 'Green-XXL', 'H-Green-XXL', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(245, 133, 'Orange-S', 'H-Orange-S', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(246, 133, 'Orange-M', 'H-Orange-M', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(247, 133, 'Orange-L', 'H-Orange-L', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(248, 133, 'Orange-XL', 'H-Orange-XL', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(249, 133, 'Orange-XXL', 'H-Orange-XXL', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(250, 133, 'Purple-S', 'H-Purple-S', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(251, 133, 'Purple-M', 'H-Purple-M', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(252, 133, 'Purple-L', 'H-Purple-L', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(253, 133, 'Purple-XL', 'H-Purple-XL', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(254, 133, 'Purple-XXL', 'H-Purple-XXL', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(255, 133, 'Red-S', 'H-Red-S', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(256, 133, 'Red-M', 'H-Red-M', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(257, 133, 'Red-L', 'H-Red-L', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(258, 133, 'Red-XL', 'H-Red-XL', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(259, 133, 'Red-XXL', 'H-Red-XXL', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(260, 133, 'White-S', 'H-White-S', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(261, 133, 'White-M', 'H-White-M', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(262, 133, 'White-L', 'H-White-L', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(263, 133, 'White-XL', 'H-White-XL', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(264, 133, 'White-XXL', 'H-White-XXL', 110.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:55:23'),
(265, 133, 'Yellow-S', 'H-Yellow-S', 1100.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:59:34'),
(266, 133, 'Yellow-M', 'H-Yellow-M', 1100.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:59:34'),
(267, 133, 'Yellow-L', 'H-Yellow-L', 1100.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:59:34'),
(268, 133, 'Yellow-XL', 'H-Yellow-XL', 1100.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:59:34'),
(269, 133, 'Yellow-XXL', 'H-Yellow-XXL', 1100.00, 1, '2020-12-09 15:55:23', '2020-12-09 15:59:34'),
(277, 135, 'L-Militory', 'St-L-Militory', 1100.00, 1, '2020-12-09 16:09:54', '2020-12-09 16:09:54'),
(278, 134, 'Black', 'H-Black', 1100.00, 1, '2020-12-09 16:12:01', '2020-12-09 16:12:01'),
(279, 134, 'Blue', 'H-Blue', 1100.00, 1, '2020-12-09 16:12:01', '2020-12-09 16:12:01'),
(280, 134, 'Gray', 'H-Gray', 1100.00, 1, '2020-12-09 16:12:01', '2020-12-09 16:12:01'),
(281, 134, 'Green', 'H-Green', 1100.00, 1, '2020-12-09 16:12:01', '2020-12-09 16:12:01'),
(282, 134, 'IndianRed', 'H-IndianRed', 1100.00, 1, '2020-12-09 16:12:01', '2020-12-09 16:12:01'),
(283, 134, 'White', 'H-White', 1100.00, 1, '2020-12-09 16:12:01', '2020-12-09 16:12:01'),
(284, 134, 'Yellow', 'H-Yellow', 1100.00, 1, '2020-12-09 16:12:01', '2020-12-09 16:12:01'),
(285, 143, 'L', 'EwG-L', 1550.00, 10, '2020-12-14 11:28:20', '2020-12-14 11:28:20'),
(286, 143, 'M', 'EwG-M', 1550.00, 10, '2020-12-14 11:28:20', '2020-12-14 11:28:20'),
(287, 143, 'XL', 'EwG-XL', 1550.00, 10, '2020-12-14 11:28:20', '2020-12-14 11:28:20'),
(288, 143, 'XXL', 'EwG-XXL', 1550.00, 10, '2020-12-14 11:28:20', '2020-12-14 11:28:20'),
(289, 147, 'DeepPink-', 'S-DeepPink-', 1.00, 1, '2020-12-17 15:43:31', '2020-12-17 15:43:31'),
(290, 149, '0-6months', 'CTGS-0-6months', 685.00, 10, '2020-12-19 09:09:21', '2020-12-19 09:09:21'),
(291, 149, '6-12months', 'CTGS-6-12months', 685.00, 10, '2020-12-19 09:09:21', '2020-12-19 09:09:21'),
(292, 149, '1-2years', 'CTGS-1-2years', 685.00, 10, '2020-12-19 09:09:21', '2020-12-19 09:09:21'),
(293, 156, 'Black-7', 'S-Black-7', 850.00, 1, '2020-12-20 11:36:30', '2020-12-20 11:36:30'),
(294, 156, 'Black-8', 'S-Black-8', 850.00, 1, '2020-12-20 11:36:30', '2020-12-20 11:36:30'),
(295, 156, 'Black-9', 'S-Black-9', 850.00, 1, '2020-12-20 11:36:30', '2020-12-20 11:36:30'),
(296, 156, 'Black-10', 'S-Black-10', 850.00, 1, '2020-12-20 11:36:30', '2020-12-20 11:36:30'),
(297, 156, 'Blue-7', 'S-Blue-7', 850.00, 1, '2020-12-20 11:36:30', '2020-12-20 11:36:30'),
(298, 156, 'Blue-8', 'S-Blue-8', 850.00, 1, '2020-12-20 11:36:30', '2020-12-20 11:36:30'),
(299, 156, 'Blue-9', 'S-Blue-9', 850.00, 1, '2020-12-20 11:36:30', '2020-12-20 11:36:30'),
(300, 156, 'Blue-10', 'S-Blue-10', 850.00, 1, '2020-12-20 11:36:30', '2020-12-20 11:36:30'),
(301, 156, 'Gray-7', 'S-Gray-7', 850.00, 1, '2020-12-20 11:36:30', '2020-12-20 11:36:30'),
(302, 156, 'Gray-8', 'S-Gray-8', 850.00, 1, '2020-12-20 11:36:30', '2020-12-20 11:36:30'),
(303, 156, 'Gray-9', 'S-Gray-9', 850.00, 1, '2020-12-20 11:36:30', '2020-12-20 11:36:30'),
(304, 156, 'Gray-10', 'S-Gray-10', 850.00, 1, '2020-12-20 11:36:30', '2020-12-20 11:36:30'),
(305, 156, 'Red-7', 'S-Red-7', 850.00, 1, '2020-12-20 11:36:30', '2020-12-20 11:36:30'),
(306, 156, 'Red-8', 'S-Red-8', 850.00, 1, '2020-12-20 11:36:30', '2020-12-20 11:36:30'),
(307, 156, 'Red-9', 'S-Red-9', 850.00, 1, '2020-12-20 11:36:30', '2020-12-20 11:36:30'),
(308, 156, 'Red-10', 'S-Red-10', 850.00, 1, '2020-12-20 11:36:30', '2020-12-20 11:36:30'),
(309, 157, 'XL', 'MSK-AP-XL', 1200.00, 1, '2020-12-21 19:17:20', '2020-12-21 19:17:20'),
(310, 161, 'Blue-42', 'Bk-Blue-42', 1000.00, 1, '2020-12-29 19:17:02', '2020-12-29 19:17:02'),
(311, 162, 'Blue-42', 'Bk-Blue-42', 1000.00, 1, '2020-12-29 19:17:05', '2020-12-29 19:17:05');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` int(11) NOT NULL DEFAULT '0',
  `comment` mediumtext COLLATE utf8_unicode_ci NOT NULL,
  `status` int(1) NOT NULL DEFAULT '1',
  `viewed` int(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(30) COLLATE utf8_unicode_ci NOT NULL,
  `permissions` mediumtext COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `permissions`, `created_at`, `updated_at`) VALUES
(1, 'Manager', '[\"1\",\"2\",\"4\"]', '2018-10-10 04:39:47', '2018-10-10 04:51:37'),
(2, 'Accountant', '[\"2\",\"3\"]', '2018-10-10 04:52:09', '2018-10-10 04:52:09');

-- --------------------------------------------------------

--
-- Table structure for table `searches`
--

CREATE TABLE `searches` (
  `id` int(11) NOT NULL,
  `query` varchar(1000) COLLATE utf8_unicode_ci NOT NULL,
  `count` int(11) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `searches`
--

INSERT INTO `searches` (`id`, `query`, `count`, `created_at`, `updated_at`) VALUES
(2, 'dcs', 1, '2020-03-08 00:29:09', '2020-03-08 00:29:09'),
(3, 'das', 3, '2020-03-08 00:29:15', '2020-03-08 00:29:50'),
(4, 'aardra', 2, '2020-11-12 00:22:36', '2020-11-18 22:59:10'),
(5, 'winter', 1, '2020-11-12 00:22:44', '2020-11-12 00:22:44'),
(6, 'wayfare', 1, '2020-11-12 17:31:05', '2020-11-12 17:31:05'),
(7, 'Sport\'s', 1, '2020-11-23 15:51:00', '2020-11-23 15:51:00'),
(8, 'Indian', 1, '2020-11-23 15:51:37', '2020-11-23 15:51:37'),
(9, 'undar armor', 1, '2020-11-23 17:40:28', '2020-11-23 17:40:28'),
(10, 'Jackets', 2, '2020-11-24 16:27:42', '2020-11-24 16:27:53'),
(11, 'Watches', 4, '2020-11-24 16:29:27', '2020-11-24 16:29:48'),
(12, 'Kurti', 1, '2020-11-24 20:41:16', '2020-11-24 20:41:16'),
(13, 'Bra', 1, '2020-11-24 23:06:30', '2020-11-24 23:06:30'),
(14, 'Buff', 1, '2020-11-28 20:50:35', '2020-11-28 20:50:35'),
(15, 'Shrujvi', 2, '2020-11-29 20:24:20', '2020-12-19 08:56:48'),
(16, 'Computer', 2, '2020-12-16 19:21:46', '2020-12-16 19:23:08'),
(17, 'batik print kurti', 3, '2020-12-18 11:41:38', '2020-12-19 12:24:49'),
(18, 'plazo', 1, '2020-12-18 11:42:00', '2020-12-18 11:42:00'),
(19, 'plaza', 3, '2020-12-18 11:42:21', '2020-12-19 12:36:55'),
(20, 'V.V fashion', 1, '2020-12-19 12:19:19', '2020-12-19 12:19:19'),
(21, 'Hatkesh Fashion', 21, '2020-12-30 11:10:51', '2021-01-22 17:26:14'),
(22, 'Hush puppies', 3, '2021-02-16 23:32:19', '2021-02-16 23:32:44');

-- --------------------------------------------------------

--
-- Table structure for table `sellers`
--

CREATE TABLE `sellers` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `seller_package_id` int(11) DEFAULT NULL,
  `remaining_uploads` int(11) NOT NULL DEFAULT '0',
  `remaining_digital_uploads` int(11) NOT NULL DEFAULT '0',
  `invalid_at` date DEFAULT NULL,
  `verification_status` int(1) NOT NULL DEFAULT '0',
  `verification_info` longtext COLLATE utf8_unicode_ci,
  `cash_on_delivery_status` int(1) NOT NULL DEFAULT '0',
  `admin_to_pay` double(8,2) NOT NULL DEFAULT '0.00',
  `bank_name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `bank_acc_name` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `bank_acc_no` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `bank_routing_no` int(50) DEFAULT NULL,
  `bank_payment_status` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `sellers`
--

INSERT INTO `sellers` (`id`, `user_id`, `seller_package_id`, `remaining_uploads`, `remaining_digital_uploads`, `invalid_at`, `verification_status`, `verification_info`, `cash_on_delivery_status`, `admin_to_pay`, `bank_name`, `bank_acc_name`, `bank_acc_no`, `bank_routing_no`, `bank_payment_status`, `created_at`, `updated_at`) VALUES
(1, 3, NULL, 0, 0, NULL, 0, '[{\"type\":\"text\",\"label\":\"Name\",\"value\":\"Mr. Seller\"},{\"type\":\"select\",\"label\":\"Marital Status\",\"value\":\"Married\"},{\"type\":\"multi_select\",\"label\":\"Company\",\"value\":\"[\\\"Company\\\"]\"},{\"type\":\"select\",\"label\":\"Gender\",\"value\":\"Male\"},{\"type\":\"file\",\"label\":\"Image\",\"value\":\"uploads\\/verification_form\\/CRWqFifcbKqibNzllBhEyUSkV6m1viknGXMEhtiW.png\"}]', 1, 78.40, NULL, NULL, NULL, NULL, 0, '2018-10-07 04:42:57', '2020-11-19 22:19:31'),
(2, 11, 5, 1000, 1000, '2023-08-15', 0, NULL, 0, 0.00, 'Axis Bank', 'Axis Bank', '123456770', 123403030, 1, '2020-11-12 00:42:21', '2020-11-27 15:18:17'),
(3, 13, NULL, 0, 0, NULL, 1, '[{\"type\":\"text\",\"label\":\"Your name\",\"value\":\"Dristi Nishit Shukla\"},{\"type\":\"text\",\"label\":\"Shop name\",\"value\":\"Aardra Fashion\"},{\"type\":\"text\",\"label\":\"Email\",\"value\":\"dristi.shukla@gmail.com\"},{\"type\":\"text\",\"label\":\"PAN Card\",\"value\":\"BUFFPS0895D\"},{\"type\":\"text\",\"label\":\"Full Address\",\"value\":\"B 10 Akshardham Bunglow 2, Government Tube Well Road, Bopal\"},{\"type\":\"text\",\"label\":\"Phone Number\",\"value\":\"8238072566\"},{\"type\":\"file\",\"label\":\"Tax Papers\",\"value\":\"uploads\\/verification_form\\/VFpfcW6S8JzPDGZhBQWULiQPtIPDm45CgFikyCgb.pdf\"}]', 0, 1860.00, 'Axis Bank', 'Dristi Shukla', '003010100498333', 13345669, 1, '2020-11-16 15:26:14', '2020-11-19 22:34:46'),
(4, 20, 5, 1000, 1000, '2023-08-15', 0, '[{\"type\":\"text\",\"label\":\"Your name\",\"value\":\"Nishith S\"},{\"type\":\"text\",\"label\":\"Shop name\",\"value\":\"Namaste24x7\"},{\"type\":\"text\",\"label\":\"Email\",\"value\":\"nhs4crypto@gmail.com\"},{\"type\":\"text\",\"label\":\"PAN Card\",\"value\":\"ABCDEFGHIO\"},{\"type\":\"text\",\"label\":\"Full Address\",\"value\":\"Bopal, Ahmedabad\"},{\"type\":\"text\",\"label\":\"Phone Number\",\"value\":\"+917016311514\"},{\"type\":\"file\",\"label\":\"PAN CARD\",\"value\":\"uploads\\/verification_form\\/POyWC3agLBMpwQGdEWriz5E3LJTNLGVs6CvGCIE5.png\"}]', 0, 0.00, NULL, 'v4localshop@gmail.com', NULL, NULL, 0, '2020-11-18 23:38:34', '2020-11-19 22:41:26'),
(6, 22, NULL, 0, 0, NULL, 1, '[{\"type\":\"text\",\"label\":\"Your name\",\"value\":\"Vishal Mulchandani\"},{\"type\":\"text\",\"label\":\"Shop name\",\"value\":\"Reruns\"},{\"type\":\"text\",\"label\":\"Email\",\"value\":\"bhujreruns@gmail.com\"},{\"type\":\"text\",\"label\":\"PAN Card\",\"value\":\"Abcdefg\"},{\"type\":\"text\",\"label\":\"Full Address\",\"value\":\"Ashapura Ring Road, Bhuj Kachchh\"},{\"type\":\"text\",\"label\":\"Phone Number\",\"value\":\"9978735841\"},{\"type\":\"file\",\"label\":\"PAN CARD\",\"value\":\"uploads\\/verification_form\\/Tpw2VwBbH2fq8v1tbPfRFX881c5VMXcpgtTOnvkv.jpeg\"}]', 0, 899.40, NULL, NULL, NULL, NULL, 0, '2020-11-21 16:08:21', '2020-11-22 21:54:28'),
(7, 24, NULL, 0, 0, NULL, 1, NULL, 0, 0.00, NULL, NULL, NULL, NULL, 0, '2020-11-22 12:34:28', '2020-11-22 12:46:26'),
(8, 25, NULL, 0, 0, NULL, 1, '[{\"type\":\"text\",\"label\":\"Your name\",\"value\":\"Shalin\"},{\"type\":\"text\",\"label\":\"Shop name\",\"value\":\"Trin Trin Cycle\"},{\"type\":\"text\",\"label\":\"Email\",\"value\":\"Trintrincycle@gmail.com\"},{\"type\":\"text\",\"label\":\"PAN Card\",\"value\":\"ANFPM0203K\"},{\"type\":\"text\",\"label\":\"Full Address\",\"value\":\"12\\/B , Jadavji Nagar , Swaminarayan Society,Bhuj\"},{\"type\":\"text\",\"label\":\"Phone Number\",\"value\":\"9979664444\"},{\"type\":\"file\",\"label\":\"PAN CARD\",\"value\":\"uploads\\/verification_form\\/JQTRY7CyFIfQKM1M6isgCltOTcAeEOwmg7I7YkLO.jpeg\"}]', 0, 0.00, NULL, NULL, NULL, NULL, 0, '2020-11-22 12:48:55', '2020-11-22 13:07:53'),
(9, 26, NULL, 0, 0, NULL, 1, NULL, 0, 0.00, NULL, NULL, NULL, NULL, 0, '2020-11-23 11:34:19', '2020-11-23 17:20:20'),
(10, 27, NULL, 0, 0, NULL, 1, '[{\"type\":\"text\",\"label\":\"Your name\",\"value\":\"Meghana Joshi\"},{\"type\":\"text\",\"label\":\"Shop name\",\"value\":\"MM Creation\"},{\"type\":\"text\",\"label\":\"Email\",\"value\":\"mehulmeghan@gmail.com\"},{\"type\":\"text\",\"label\":\"PAN Card\",\"value\":\"ABcDeD\"},{\"type\":\"text\",\"label\":\"Full Address\",\"value\":\"Hirani Park 1, Surjan Casa, Bhuj Kachchh\"},{\"type\":\"text\",\"label\":\"Phone Number\",\"value\":\"7228966190\"},{\"type\":\"file\",\"label\":\"PAN CARD\",\"value\":\"uploads\\/verification_form\\/QirNE1FXfet2B1KL1k0Z7thaOGzW8GFSQyexNv0V.jpeg\"}]', 0, 0.00, NULL, NULL, NULL, NULL, 0, '2020-11-23 18:45:26', '2020-11-23 18:51:02'),
(11, 34, NULL, 0, 0, NULL, 1, NULL, 1, 719.20, NULL, NULL, NULL, NULL, 0, '2020-11-27 00:32:36', '2020-11-29 14:00:18'),
(12, 35, NULL, 0, 0, NULL, 1, '[{\"type\":\"text\",\"label\":\"Your name\",\"value\":\"Shruti Tripathi\"},{\"type\":\"text\",\"label\":\"Shop name\",\"value\":\"Shrujvi\'s Collection\"},{\"type\":\"text\",\"label\":\"Email\",\"value\":\"shrujvicollection@gmail.com\"},{\"type\":\"text\",\"label\":\"PAN Card \\/ Store Visiting Card\\/ Municipal Certificate\\/\",\"value\":\"AFZPT5940E\"},{\"type\":\"text\",\"label\":\"Full Address\",\"value\":\"Galaxy 704, Vicenza Magnolia,  Gotri, Vadodara\"},{\"type\":\"text\",\"label\":\"Phone Number\",\"value\":\"8141931122\"},{\"type\":\"file\",\"label\":\"PAN CARD \\/ Store Visiting Card\\/ Municipal Certificate\",\"value\":\"uploads\\/verification_form\\/GnBsJw3x1OvmzCI9FWETNTHn3Nrx1ljmvyBnJk4g.jpeg\"}]', 1, 0.00, NULL, NULL, NULL, NULL, 0, '2020-11-27 12:50:28', '2020-11-29 21:10:04'),
(13, 36, NULL, 0, 0, NULL, 0, NULL, 0, 0.00, NULL, NULL, NULL, NULL, 0, '2020-11-27 19:10:14', '2020-11-27 19:10:14'),
(14, 52, NULL, 0, 0, NULL, 1, '[{\"type\":\"text\",\"label\":\"Your name\",\"value\":\"Ashlesha Hiren Vora\"},{\"type\":\"text\",\"label\":\"Shop name\",\"value\":\"Hatkesh fashion\"},{\"type\":\"text\",\"label\":\"Email\",\"value\":\"ashlesha.vora@gmail.com\"},{\"type\":\"text\",\"label\":\"PAN Card \\/ Store Visiting Card\\/ Municipal Certificate\\/\",\"value\":\"AGKPV4873E\"},{\"type\":\"text\",\"label\":\"Full Address\",\"value\":\"Vinayak, Gerwali Vandi, Braham puri, Bhuj\"},{\"type\":\"text\",\"label\":\"Phone Number\",\"value\":\"9426815370\"},{\"type\":\"file\",\"label\":\"PAN CARD \\/ Store Visiting Card\\/ Municipal Certificate\",\"value\":\"uploads\\/verification_form\\/pghC8B20bEgr4etDEsXYxn8oj1xvkLOoR7IBhvvB.jpeg\"}]', 0, 0.00, NULL, NULL, NULL, NULL, 0, '2020-12-12 10:55:18', '2020-12-18 14:41:30'),
(15, 52, NULL, 0, 0, NULL, 0, NULL, 0, 0.00, NULL, NULL, NULL, NULL, 0, '2020-12-12 10:58:12', '2020-12-12 10:58:12'),
(16, 53, NULL, 0, 0, NULL, 1, NULL, 0, 0.00, NULL, NULL, NULL, NULL, 0, '2020-12-14 22:20:39', '2020-12-15 10:03:20'),
(18, 55, NULL, 0, 0, NULL, 0, NULL, 0, 0.00, NULL, NULL, NULL, NULL, 0, '2020-12-16 19:16:30', '2020-12-16 19:16:30'),
(20, 57, NULL, 0, 0, NULL, 0, NULL, 0, 0.00, NULL, NULL, NULL, NULL, 0, '2020-12-18 11:42:55', '2020-12-18 11:42:55'),
(21, 57, NULL, 0, 0, NULL, 0, NULL, 0, 0.00, NULL, NULL, NULL, NULL, 0, '2020-12-18 11:43:17', '2020-12-18 11:43:17'),
(22, 58, NULL, 0, 0, NULL, 1, '[{\"type\":\"text\",\"label\":\"Your name\",\"value\":\"Jalpa Joshi\"},{\"type\":\"text\",\"label\":\"Shop name\",\"value\":\"V.V Fashion\"},{\"type\":\"text\",\"label\":\"Email\",\"value\":\"nims.icicipru@gmail.com\"},{\"type\":\"text\",\"label\":\"PAN Card \\/ Store Visiting Card\\/ Municipal Certificate\\/\",\"value\":\"AIDPJ6038Q\"},{\"type\":\"text\",\"label\":\"Full Address\",\"value\":\"140 Lions nagar, Opp Kovai Nagar, Mundra Road, Bhuj\"},{\"type\":\"text\",\"label\":\"Phone Number\",\"value\":\"8320961932\"},{\"type\":\"file\",\"label\":\"PAN CARD \\/ Store Visiting Card\\/ Municipal Certificate\",\"value\":\"uploads\\/verification_form\\/priA8yLzZgP46S3bpZ49eyWkFydHfrQlPpWFM3ju.jpeg\"}]', 0, 0.00, NULL, NULL, NULL, NULL, 0, '2020-12-18 14:35:49', '2020-12-19 12:43:19'),
(23, 60, NULL, 0, 0, NULL, 1, NULL, 0, 0.00, NULL, NULL, NULL, NULL, 0, '2021-01-01 18:41:51', '2021-02-19 11:31:25'),
(24, 61, NULL, 0, 0, NULL, 1, NULL, 0, 0.00, NULL, NULL, NULL, NULL, 0, '2021-02-12 14:33:42', '2021-02-19 11:31:16');

-- --------------------------------------------------------

--
-- Table structure for table `seller_packages`
--

CREATE TABLE `seller_packages` (
  `id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `amount` double(11,2) NOT NULL DEFAULT '0.00',
  `product_upload` int(11) NOT NULL DEFAULT '0',
  `digital_product_upload` int(11) NOT NULL DEFAULT '0',
  `logo` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `duration` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `seller_packages`
--

INSERT INTO `seller_packages` (`id`, `name`, `amount`, `product_upload`, `digital_product_upload`, `logo`, `duration`, `created_at`, `updated_at`) VALUES
(5, 'Free', 0.00, 1000, 1000, 'uploads/seller_package/QaZnv3JaDOcAiFAoK8exJIf8nue3ZKdMF6IanvuO.svg', 1000, '2020-11-18 23:35:03', '2020-11-18 23:35:27');

-- --------------------------------------------------------

--
-- Table structure for table `seller_withdraw_requests`
--

CREATE TABLE `seller_withdraw_requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `amount` double(8,2) DEFAULT NULL,
  `message` longtext,
  `status` int(1) DEFAULT NULL,
  `viewed` int(1) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `seo_settings`
--

CREATE TABLE `seo_settings` (
  `id` int(11) NOT NULL,
  `keyword` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `author` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `revisit` int(11) NOT NULL,
  `sitemap_link` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `seo_settings`
--

INSERT INTO `seo_settings` (`id`, `keyword`, `author`, `revisit`, `sitemap_link`, `description`, `created_at`, `updated_at`) VALUES
(1, 'vocal for local,hyperlocal,shopping,ecommerce,aatmnirbhar,narendramodi,india,make in india,digital india,amazon,flipkart,molwol,online store,dukaan,meesho', 'V4local', 11, 'https://www.v4local.in', 'V4local is listing service for local sellers and housewives. Be vocal for Local. Support your friends and neighbors..', '2020-11-11 16:22:16', '2020-11-11 21:52:16');

-- --------------------------------------------------------

--
-- Table structure for table `shops`
--

CREATE TABLE `shops` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `logo` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `sliders` longtext COLLATE utf8_unicode_ci,
  `address` varchar(500) COLLATE utf8_unicode_ci DEFAULT NULL,
  `facebook` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `google` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `twitter` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `youtube` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `slug` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `meta_title` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `meta_description` text COLLATE utf8_unicode_ci,
  `pick_up_point_id` text COLLATE utf8_unicode_ci,
  `shipping_cost` double(8,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `shops`
--

INSERT INTO `shops` (`id`, `user_id`, `name`, `logo`, `sliders`, `address`, `facebook`, `google`, `twitter`, `youtube`, `slug`, `meta_title`, `meta_description`, `pick_up_point_id`, `shipping_cost`, `created_at`, `updated_at`) VALUES
(1, 3, 'Demo Seller Shop', 'shop/logo/Gt1xw7vjTpMnwpADkGSilc35qrAfcw02kuZ36Jdn.png', '[\"uploads\\/shop\\/sliders\\/lToeKDeUyWcxy1HRs2yH37oBLyIwEwyPkqdyXBRO.jpeg\",\"uploads\\/shop\\/sliders\\/asDBJ3Bro1ijNaNnx3Hpnp6uq3n66ndyLczOJ0F6.jpeg\",\"uploads\\/shop\\/sliders\\/ltwUfHND4QP1K7bPFbuOC4i8v6zL9KHJKzex4zaX.jpeg\"]', 'House : Demo, Road : Demo, Section : Demo', 'www.facebook.com', 'www.google.com', 'www.twitter.com', 'www.youtube.com', 'Demo-Seller-Shop-1', 'Demo Seller Shop Title', 'Demo description', NULL, 0.00, '2018-11-27 10:23:13', '2019-08-06 06:43:16'),
(2, 11, 'Cool wear', 'uploads/shop/logo/TJEEwiVwC4rYmbBjCXwCcZRlfa8zdWEL1Bf3VVCW.jpeg', NULL, 'bhuj', NULL, NULL, NULL, NULL, 'Cool-wear-2', 'Cool Wear', 'Cool Wear', '[]', 0.00, '2020-11-12 00:42:21', '2020-11-19 22:20:36'),
(3, 13, 'Aardra Fashion', 'uploads/shop/logo/sAkRZDhaHbIgY9DWM7pYDi3m18tG2IAqjDtBBXP4.png', '[\"uploads\\/shop\\/sliders\\/2ahJfcVVqCoqTw50rbvgp49lurdbuJYOA8vKMdcA.png\"]', 'B/10 Akshardham Bunglow 2 , Near Government Tubewell. Bopal. Ahmedabad 380058', NULL, NULL, NULL, NULL, 'Aardra-Fashion-3', 'Aardra-Fashion', 'Aardra Fashion', '[]', 0.00, '2020-11-16 15:26:14', '2020-11-19 22:37:18'),
(5, 22, 'Reruns', NULL, NULL, 'Ashapura Ring Road, Sonivad Circle, Survana Plaza, Shop No 1, Bhuj Kachchh Gujarat', NULL, NULL, NULL, NULL, 'Reruns-5', 'Reruns Bhuj', 'Reruns - Big Brands Small Price', '[]', 0.00, '2020-11-21 16:08:21', '2020-11-21 16:09:11'),
(6, 24, 'Dreamz', NULL, NULL, 'Charging Bari Ring Road,  BHuj Kachchh', NULL, NULL, NULL, NULL, 'Dreamz-', NULL, NULL, NULL, 0.00, '2020-11-22 12:34:28', '2020-11-22 12:34:28'),
(7, 25, 'TRIN TRIN CYCLE', NULL, NULL, '12/B , Jadavji Nagar , Bhuj', NULL, NULL, NULL, NULL, 'TRIN-TRIN-CYCLE-', NULL, NULL, NULL, 0.00, '2020-11-22 12:48:55', '2020-11-22 12:48:55'),
(8, 26, 'Angel Assories', NULL, NULL, '16 Airport Ring Road, Beside Real Paprika Bhuj', NULL, NULL, NULL, NULL, 'Angel-Assories-', NULL, NULL, NULL, 0.00, '2020-11-23 11:34:19', '2020-11-23 11:34:19'),
(9, 27, 'MM Creation', NULL, NULL, 'Hirani Park 1, Surjan Casa, Near Engineering College, Bhuj Kachchh', NULL, NULL, NULL, NULL, 'MM-Creation-', NULL, NULL, NULL, 0.00, '2020-11-23 18:45:26', '2020-11-23 18:45:26'),
(10, 34, 'KUTHESHOP', 'uploads/shop/logo/bOKYTqbVVEiU0QARvFwZfcXzoq3nz2fdkqPZOOR8.jpeg', '[\"uploads\\/shop\\/sliders\\/aamuXX0S95xWTH3LSl9TWWWhyD6lmPGp2LCATEqb.png\"]', 'Bhuj', NULL, NULL, NULL, NULL, 'KUTHESHOP-10', 'KUTHESHOP', 'KUTHESHOP - Kurti, Dress Material, Accessories, Men\'s Fashion, Sports Item, Accessories', '[]', 0.00, '2020-11-27 00:32:36', '2020-11-27 15:45:14'),
(11, 35, 'Shrujvi\'s Collection', 'uploads/shop/logo/WG7CpvDspWM7yIuI4I8JQMTvy5oGvOfAItu8Wf6s.jpeg', '[]', 'Galaxy 704, Vicenza Magnolia,  Gotri, Vadodara', NULL, NULL, NULL, NULL, 'Shrujvi\'s-Collection-11', 'Clothing and Accessories', 'Men\'s Fashion ,Women\'s Fashion,  Kid\'s Fashion \r\nJewellery,Makeup and Beauty, Handbags,Home and Kitchen Utilities', '[]', 0.00, '2020-11-27 12:50:28', '2020-11-29 21:08:52'),
(12, 36, 'Mahek creation', NULL, NULL, 'Ahemdabad', NULL, NULL, NULL, NULL, 'Mahek-creation-', NULL, NULL, NULL, 0.00, '2020-11-27 19:10:14', '2020-11-27 19:10:14'),
(13, 52, 'Hatkesh fashion', NULL, '[\"uploads\\/shop\\/sliders\\/NtpfDHrmy2RTctSaur8rsXwwurujdZVLAhrKreb8.jpeg\",\"uploads\\/shop\\/sliders\\/O3WRES1PpAkw0xF89g0BA6Uy94EXS8D4DL1Yntaj.jpeg\",\"uploads\\/shop\\/sliders\\/ra3HCm0YbYCxjn6WKA0L1ho5QDdKEhHgdl7ui7Ke.jpeg\",\"uploads\\/shop\\/sliders\\/DXS69FU0Ap4SbW5QWrTftn9H5pAM6S1eW0aBB2ly.jpeg\"]', '\"Vinayak, Gerwali Vandi, Brahampuri,Bhuj', NULL, NULL, NULL, NULL, 'Hatkesh-fashion-13', 'Model silk', 'Modal silk ajrakh duppta\r\nFull size\r\nLenth 2.5 mt\r\nWidth 42 inches\r\nmrp 1250', '[]', 0.00, '2020-12-12 10:55:18', '2020-12-31 16:08:09'),
(14, 53, 'Hasti colocation', NULL, NULL, 'Bhuj', NULL, NULL, NULL, NULL, 'Hasti-colocation-', NULL, NULL, NULL, 0.00, '2020-12-14 22:20:39', '2020-12-14 22:20:39'),
(16, 55, 'Syscare', NULL, '[]', 'Bhuj', NULL, NULL, NULL, NULL, 'Syscare-', NULL, NULL, NULL, 0.00, '2020-12-16 19:16:30', '2020-12-16 19:19:29'),
(18, 58, 'V.V Fashion', NULL, NULL, '140 Lions nagar, Opp Kovai Nagar Mundra Road Bhuj', NULL, NULL, NULL, NULL, 'V.V-Fashion-18', 'Batik Print kurti', 'Batik Print Kurti', '[]', 0.00, '2020-12-18 14:35:49', '2020-12-18 14:36:24'),
(19, 60, 'Aarshvee', NULL, NULL, 'Ahmedabad', NULL, NULL, NULL, NULL, 'Aarshvee-', NULL, NULL, NULL, 0.00, '2021-01-01 18:41:51', '2021-01-01 18:41:51'),
(20, 61, 'Mruga_creation', NULL, NULL, '304,umang avenue', NULL, NULL, NULL, NULL, 'Mruga_creation-', NULL, NULL, NULL, 0.00, '2021-02-12 14:33:42', '2021-02-12 14:33:42');

-- --------------------------------------------------------

--
-- Table structure for table `sliders`
--

CREATE TABLE `sliders` (
  `id` int(11) NOT NULL,
  `photo` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `published` int(1) NOT NULL DEFAULT '1',
  `link` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `sliders`
--

INSERT INTO `sliders` (`id`, `photo`, `published`, `link`, `created_at`, `updated_at`) VALUES
(7, 'uploads/sliders/slider-image.jpg', 0, NULL, '2019-03-12 05:58:05', '2020-11-19 21:43:49'),
(8, 'uploads/sliders/slider-image.jpg', 0, NULL, '2019-03-12 05:58:12', '2020-11-16 16:59:54'),
(9, 'uploads/sliders/nhPRjDm3jpe8icXAJrlxtEGpKhD3V0aP6Tzo20dI.png', 1, 'https://ecommercemultivendor.softwarestore.biz/', '2020-11-19 21:42:46', '2020-11-19 21:42:46'),
(11, 'uploads/sliders/9A6PmVeW1piWauc97Hf7WwFtpqz1QMTzoNSKi1ps.png', 1, 'https://ecommercemultivendor.softwarestore.biz/', '2020-11-19 21:44:27', '2020-11-19 21:44:27'),
(12, 'uploads/sliders/77KmfR3MWAIbdsRwABHsIWtielndojzuV2Ql0NwG.png', 1, 'https://ecommercemultivendor.softwarestore.biz/', '2020-11-19 21:44:27', '2020-11-19 21:44:27'),
(13, 'uploads/sliders/cGW62Vx04CAVUwQgFh6wVYY8cZvDuxC0eOa93a89.png', 1, 'https://ecommercemultivendor.softwarestore.biz/', '2020-11-19 21:44:27', '2020-11-19 21:44:27'),
(14, 'uploads/sliders/7UnOZs4EdsMvZhmOeK9jc0tddZDQ31qCtBoXYBE0.png', 1, 'https://ecommercemultivendor.softwarestore.biz/', '2020-11-19 21:44:27', '2020-11-19 21:44:27');

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`id`, `user_id`, `role_id`, `created_at`, `updated_at`) VALUES
(1, 10, 1, '2020-11-11 23:43:08', '2020-11-11 23:43:08');

-- --------------------------------------------------------

--
-- Table structure for table `subscribers`
--

CREATE TABLE `subscribers` (
  `id` int(11) NOT NULL,
  `email` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `subscribers`
--

INSERT INTO `subscribers` (`id`, `email`, `created_at`, `updated_at`) VALUES
(1, 'nhs4learning@gmail.com', '2020-11-12 00:31:06', '2020-11-12 00:31:06'),
(2, 'shivalings@gmail.com', '2020-11-24 15:31:33', '2020-11-24 15:31:33'),
(3, 'ashlesha.vora@gmail.com', '2020-12-12 17:03:38', '2020-12-12 17:03:38');

-- --------------------------------------------------------

--
-- Table structure for table `sub_categories`
--

CREATE TABLE `sub_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `category_id` int(11) NOT NULL,
  `slug` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `meta_title` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `meta_description` text COLLATE utf8_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `sub_categories`
--

INSERT INTO `sub_categories` (`id`, `name`, `category_id`, `slug`, `meta_title`, `meta_description`, `created_at`, `updated_at`) VALUES
(1, 'Women\'s Clothing', 1, 'women-clothing', 'women-clothing', 'Women\'s Clothing including western ware, ethnic ware, Lingerie and Night ware, sports ware', '2019-03-12 06:13:24', '2020-11-11 22:46:10'),
(2, 'Accessories', 1, 'women-accessories', 'women-accessories', 'Women\'s Accessories including watches, bags, clutches, jewellery, sunglasses etc.', '2019-03-12 06:13:44', '2020-11-11 22:48:23'),
(3, 'Women\'s Shoes', 1, 'women-shoes', 'women-shoes', 'Women\'s Shoes including Shoes, Fashion Sandals, Ballerina etc.', '2019-03-12 06:13:59', '2020-11-11 22:49:41'),
(4, 'Men\'s Clothing', 2, 'mens-clothing', 'mens-clothing', 'Men\'s clothing including clothing, T-shirts and Polos, Shirts, Jeans , Inner ware etc.', '2019-03-12 06:18:25', '2020-11-11 22:51:10'),
(5, 'Accessories', 2, 'mens-accessories', 'mens-accessories', 'Men\'s Accessories including Watches, Bags & Luggage, Sunglasses, Jewellery , Wallet etc.', '2019-03-12 06:18:38', '2020-11-11 22:52:17'),
(6, 'Men\'s Shoes', 2, 'mens-shoes', 'mens-shoes', 'Men\'s shoes including Shoes, Sport Shoes, Casual Shoes, Formal Shoes etc.', '2019-03-12 06:18:51', '2020-11-11 22:53:23'),
(7, 'Kitchen Items', 3, 'kitchen-items', 'kitchen-items', 'Kitchen Items including kitchen Storages, Containers, Bakeware, Cookware, Kitchen tools, Tableware ,Cake boxes, Garbage bins, Jars, Microware sets etc.', '2019-03-12 06:19:05', '2020-11-11 22:58:07'),
(8, 'Home Decoration', 3, 'home-decoration', 'home-decoration', 'Home Decoration and Improvement items including Wall Clocks, Alarm Clocks, Decorative Frames, Wall Decals, Photo Frames, Fridge Magnets, Idols & Figurines, Wind Chimes etc.', '2019-03-12 06:19:13', '2020-11-11 23:01:01'),
(9, 'Garden And Outdoors', 3, 'garden-and-outdoors', 'garden-and-outdoors', 'Garden and Outdoor items including Seeds , Plants, Decorative Pots, Wind Chimes, Lighting, Barbeque Grills etc.', '2019-03-12 06:19:22', '2020-11-11 23:03:26'),
(10, 'Toys And Baby Products', 4, 'Toys-And-Baby-Products', 'toys-and-baby-products', 'Toys and Games, Baby Products etc.', '2020-11-16 16:30:02', '2020-11-16 16:38:33'),
(11, 'Kid\'s Fashion', 4, 'Kids-Fashion-and-toys', 'kids-fashion', 'Kids Clothing, Shoes, Watches, School Bags, Baby Fashion etc.', '2020-11-16 16:31:03', '2020-11-16 16:38:16'),
(12, 'Accessories', 5, 'sports-accessories', 'sports-accessories', 'Accessories used in Sports and Fitness.', '2020-11-16 16:37:40', '2020-11-16 16:38:04'),
(13, 'Gears', 5, 'sports-gears', 'sports-gears', 'Sport Gears', '2020-11-16 16:39:14', '2020-11-16 16:39:26'),
(14, 'Equipment', 5, 'equipment-0y232', 'sports-equipment', 'Sports Equipment', '2020-11-16 16:40:07', '2020-11-16 16:45:16'),
(16, 'Hoodies', 2, 'Hoodies-ihi9t', NULL, NULL, '2020-12-09 15:44:18', '2020-12-09 15:44:18'),
(17, 'Sweat T-Shitt', 2, 'Sweat-T-Shitt-bUTlj', NULL, NULL, '2020-12-09 15:44:34', '2020-12-09 15:44:34');

-- --------------------------------------------------------

--
-- Table structure for table `sub_sub_categories`
--

CREATE TABLE `sub_sub_categories` (
  `id` int(11) NOT NULL,
  `sub_category_id` int(11) NOT NULL,
  `name` varchar(50) COLLATE utf8_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `meta_title` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `meta_description` text COLLATE utf8_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `sub_sub_categories`
--

INSERT INTO `sub_sub_categories` (`id`, `sub_category_id`, `name`, `slug`, `meta_title`, `meta_description`, `created_at`, `updated_at`) VALUES
(1, 1, 'Ethnic Ware', 'ethnic-ware', 'ethnic-ware', 'Women\'s Ethnic ware includes Sarees, Kurtis, Kurtas, Dress Materials, Salwar Suits, Lehnga Cholis, Gown, Bottom Ware, Blouses, Chunnis, Dupattas etc.', '2019-03-12 06:19:49', '2020-11-11 23:09:48'),
(2, 1, 'Western Ware', 'western-ware', 'western-ware', 'Western Ware includes T-shirts, Tops, Shirts, Dress and Jumpsuits, Trousers, Jeans and Jeggings, Skirts and Shorts, Leggings, Winter Ware, Shrugs, Track Pants, Suits and Blazers, Ponchos and Caps etc.', '2019-03-12 06:20:23', '2020-11-11 23:12:31'),
(3, 1, 'Lingerie & Nightware', 'lingerie-and-nightware', 'lingerie-and-nightware', 'Lingerie and Night ware includes Sleep and Lounge Ware, Nighties and Night Suits, Pyjama Sets, Shorts , Bras, Panties, Shapeware, Camisoles and Tanks, Lingerie Sets, Accessories, Pantyhose. Stockings, Thermals etc.', '2019-03-12 06:20:43', '2020-11-11 23:16:49'),
(4, 2, 'Watches', 'women-watches', 'women-watches', 'Ladies Fashion Watches', '2019-03-12 06:21:28', '2020-11-11 23:19:29'),
(5, 2, 'Handbags And Clutches', 'handbags-and-clutches', 'handbags-and-clutches', 'Handbags, Purses and Clutches', '2019-03-12 06:21:40', '2020-11-11 23:21:20'),
(6, 2, 'Jewellery And Sunglasses', 'jewellery-and-sunglasses', 'jewellery-and-sunglasses', 'Fashion Jewellery and Women Sunglasses', '2019-03-12 06:21:56', '2020-11-11 23:23:18'),
(7, 3, 'Shoes', 'women-shoes', 'women-shoes', 'Women Shoes including Flats, Casual Shoes, Ethnic Footwear, Slippers, Flip Flop, Formal Shoes etc.', '2019-03-12 06:23:31', '2020-11-11 23:26:19'),
(8, 3, 'Fashion Sandals', 'fashion-sandals', 'fashion-sandals', 'Women\'s Fashion Sandals and Footwear', '2019-03-12 06:23:48', '2020-11-11 23:27:18'),
(9, 3, 'Ballerinas', 'women-ballerinas', 'women-ballerinas', 'Ballerina Flats for women and girls', '2019-03-12 06:24:01', '2020-11-11 23:28:50'),
(10, 4, 'T-shirts And Polos', 'tshirts-and-polos', 'tshirts-and-polos', 'Men\'s T-shirt & Polo', '2019-03-12 06:24:37', '2020-11-11 23:30:59'),
(11, 4, 'Jeans', 'men-jeans', 'men-jeans', 'Men\'s Jeans', '2019-03-12 06:25:14', '2020-11-11 23:31:42'),
(12, 4, 'Shirts', 'men-shirts', 'men-shirts', 'Men\'s Shirts', '2019-03-12 06:25:25', '2020-11-11 23:32:32'),
(13, 5, 'Watches', 'men-watches', 'men-watches', 'Men\'s Watches', '2019-03-12 06:25:58', '2020-11-11 23:33:30'),
(14, 5, 'Handbags And Luggage', 'handbags-and-luggage', 'handbags-and-luggage', 'Men\'s Hand Bags, Luggage, Wallets etc.', '2019-03-12 06:26:16', '2020-11-11 23:35:35'),
(15, 5, 'Jewellery And Sunglasses', 'jewellery-and-sunglasses', 'jewellery-and-sunglasses', 'Men\'s Jewellery And Sunglasses', '2019-03-12 06:27:17', '2020-11-11 23:36:38'),
(16, 6, 'Sports Shoes', 'men-sports-shoes', 'men-sports-shoes', 'Men\'s Sports Shoes', '2019-03-12 06:27:29', '2020-11-11 23:38:24'),
(17, 6, 'Formal Shoes', 'men-formal-shoes', 'men-formal-shoes', 'Men\'s Formal Shoes.', '2019-03-12 06:27:41', '2020-11-11 23:38:59'),
(18, 6, 'Casual Shoes', 'Casual-Shoes-yxHyW', 'men-casual-shoes', 'Men\'s Casual Shoes.', '2020-11-11 23:39:33', '2020-11-11 23:39:33'),
(19, 7, 'Kitchen Tools', 'Kitchen-Tools-C9fwr', 'kitchen-tools', 'Kitchen Accessories and Tools.', '2020-11-11 23:47:22', '2020-11-11 23:47:22'),
(20, 7, 'Storage And Containers', 'Storage-And-Containers-B5I1p', 'storage-and-containers', 'Containers, Jars, Bottles etc.', '2020-11-11 23:48:06', '2020-11-11 23:48:06'),
(21, 8, 'Decoration Items', 'Decoration-Items-nGPxw', 'home-decoration-items', 'Wall Clocks, Wall Decals, Stickers, Photo Frames Etc.', '2020-11-11 23:49:57', '2020-11-11 23:49:57'),
(22, 8, 'Bedroom Items', 'Bedroom-Items-lkIyL', 'bedroom-items', 'Bedsheets, Linens, Pillow Covers, Bedding Sets etc.', '2020-11-11 23:52:06', '2020-11-11 23:52:06'),
(23, 9, 'Gardening', 'Gardening-nUpMJ', 'gardening-items', 'Seeds, Plants, Pots etc.', '2020-11-11 23:53:11', '2020-11-11 23:53:11'),
(24, 9, 'Outdoor Decors', 'Outdoor-Decors-fASYy', 'outdoor-decors', 'Outdoor Decoration Items like lighting, Sculptures, Decorative Pots etc.', '2020-11-11 23:54:52', '2020-11-11 23:54:52'),
(25, 13, 'Cricket', 'Cricket-v8iSM', NULL, 'Cricket Gears', '2020-11-16 16:41:28', '2020-11-16 16:41:28'),
(26, 13, 'Cycling', 'Cycling-chkpR', 'cycling', 'Cycling Gears', '2020-11-16 16:41:53', '2020-11-16 16:41:53'),
(27, 13, 'Tennis', 'Tennis-3Zewg', 'tennis-gears', 'Tennis Gears', '2020-11-16 16:42:16', '2020-11-16 16:42:16'),
(28, 13, 'Camping and Hiking', 'Camping-and-Hiking-CYeMZ', 'hiking-gears', 'Camping and Hiking Gears', '2020-11-16 16:42:52', '2020-11-16 16:42:52'),
(29, 12, 'Cricket', 'Cricket-9JOIC', 'cricket-accessories', 'Cricket Accessories', '2020-11-16 16:43:35', '2020-11-16 16:43:35'),
(30, 12, 'Cycling', 'Cycling-acxo7', 'cycling-accessories', 'Cycling Accessories', '2020-11-16 16:43:57', '2020-11-16 16:43:57'),
(31, 12, 'Camping and Hiking', 'Camping-and-Hiking-f7L5N', 'hiking-accessories', 'Camping and Hiking Accessories', '2020-11-16 16:44:20', '2020-11-16 16:44:20'),
(32, 12, 'Tennis', 'Tennis-pz2ta', 'tennis-accessories', 'Tennis Accessories.', '2020-11-16 16:44:52', '2020-11-16 16:44:52'),
(33, 14, 'Cardio and Strength', 'Cardio-and-Strength-K3Hfu', 'cardio-equipment', 'Gym and Fitness Equipment.', '2020-11-16 16:48:14', '2020-11-16 16:48:14'),
(34, 4, 'Sports Wear', 'Sports-Wear-ZFy49', 'Sportswear-men', 'Men\'s Sports Wear', '2020-11-23 17:09:03', '2020-11-23 17:09:03'),
(35, 1, 'Plus Size Clothing', 'Plus-Size-Clothing-hidHF', 'plus size women', 'Plus Size clothing for women.', '2020-11-26 22:35:04', '2020-11-26 22:35:04');

-- --------------------------------------------------------

--
-- Table structure for table `tickets`
--

CREATE TABLE `tickets` (
  `id` int(11) NOT NULL,
  `code` int(6) NOT NULL,
  `user_id` int(11) NOT NULL,
  `subject` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `details` longtext COLLATE utf8_unicode_ci,
  `files` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `status` varchar(10) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'pending',
  `viewed` int(1) NOT NULL DEFAULT '0',
  `client_viewed` int(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `tickets`
--

INSERT INTO `tickets` (`id`, `code`, `user_id`, `subject`, `details`, `files`, `status`, `viewed`, `client_viewed`, `created_at`, `updated_at`) VALUES
(1, 10000053, 11, 'Payment is not released', '<p>Hi Support,,</p><p><br></p><p>My payment is hold.</p><p><br></p><p>Regards,</p><p>Seller<br></p>', '[{\"name\":\"cash-register.png\",\"path\":\"uploads\\/support_tickets\\/\\/ZQT8MEbQFD1CbgjLQ9FH8MuHejkUm04UqiUEfTPY.png\"}]', 'open', 1, 1, '2020-11-12 12:10:14', '2020-11-12 17:40:14'),
(2, 1000005420, 13, 'Test Ticket', 'dkljldfjlldlroeoe', NULL, 'pending', 0, 0, '2020-11-16 16:17:20', '2020-11-16 16:17:20');

-- --------------------------------------------------------

--
-- Table structure for table `ticket_replies`
--

CREATE TABLE `ticket_replies` (
  `id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reply` longtext COLLATE utf8_unicode_ci NOT NULL,
  `files` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `ticket_replies`
--

INSERT INTO `ticket_replies` (`id`, `ticket_id`, `user_id`, `reply`, `files`, `created_at`, `updated_at`) VALUES
(1, 1, 9, 'We are looking into it.', NULL, '2020-11-12 17:39:58', '2020-11-12 17:39:58');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `referred_by` int(11) DEFAULT NULL,
  `provider_id` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `user_type` varchar(10) COLLATE utf8_unicode_ci NOT NULL DEFAULT 'customer',
  `name` varchar(191) COLLATE utf8_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8_unicode_ci DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `verification_code` text COLLATE utf8_unicode_ci,
  `new_email_verificiation_code` text COLLATE utf8_unicode_ci,
  `password` varchar(191) COLLATE utf8_unicode_ci DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `avatar` varchar(256) COLLATE utf8_unicode_ci DEFAULT NULL,
  `avatar_original` varchar(256) COLLATE utf8_unicode_ci DEFAULT NULL,
  `address` varchar(300) COLLATE utf8_unicode_ci DEFAULT NULL,
  `country` varchar(30) COLLATE utf8_unicode_ci DEFAULT NULL,
  `city` varchar(30) COLLATE utf8_unicode_ci DEFAULT NULL,
  `postal_code` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `balance` double(8,2) NOT NULL DEFAULT '0.00',
  `banned` tinyint(4) NOT NULL DEFAULT '0',
  `referral_code` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `customer_package_id` int(11) DEFAULT NULL,
  `remaining_uploads` int(11) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `referred_by`, `provider_id`, `user_type`, `name`, `email`, `email_verified_at`, `verification_code`, `new_email_verificiation_code`, `password`, `remember_token`, `avatar`, `avatar_original`, `address`, `country`, `city`, `postal_code`, `phone`, `balance`, `banned`, `referral_code`, `customer_package_id`, `remaining_uploads`, `created_at`, `updated_at`) VALUES
(3, NULL, NULL, 'seller', 'Mr. Seller', 'seller@example.com', '2018-12-11 18:00:00', NULL, NULL, '$2y$10$eUKRlkmm2TAug75cfGQ4i.WoUbcJ2uVPqUlVkox.cv4CCyGEIMQEm', '1zoU4eQxnOC5yxRWLsTzMNBPpJuOvTk4g3GMUVYIrbGijiXHOfIlFq0wHrIn', 'https://lh3.googleusercontent.com/-7OnRtLyua5Q/AAAAAAAAAAI/AAAAAAAADRk/VqWKMl4f8CI/photo.jpg?sz=50', 'uploads/ucQhvfz4EQXNeTbN8Eif0Cpq5LnOwvg8t7qKNKVs.jpeg', 'Demo address', 'US', 'Demo city', '1234', NULL, 0.00, 0, '3dLUoHsR1l', NULL, NULL, '2018-10-07 04:42:57', '2020-03-05 01:33:22'),
(8, NULL, NULL, 'customer', 'Mr. Customer', 'customer@example.com', '2018-12-11 18:00:00', NULL, NULL, '$2y$10$eUKRlkmm2TAug75cfGQ4i.WoUbcJ2uVPqUlVkox.cv4CCyGEIMQEm', '9ndcz5o7xgnuxctJIbvUQcP41QKmgnWCc7JDSnWdHOvipOP2AijpamCNafEe', 'https://lh3.googleusercontent.com/-7OnRtLyua5Q/AAAAAAAAAAI/AAAAAAAADRk/VqWKMl4f8CI/photo.jpg?sz=50', 'uploads/ucQhvfz4EQXNeTbN8Eif0Cpq5LnOwvg8t7qKNKVs.jpeg', 'Demo address', 'US', 'Demo city', '1234', NULL, 0.00, 0, '8zJTyXTlTT', NULL, NULL, '2018-10-07 04:42:57', '2020-03-03 04:26:11'),
(9, NULL, NULL, 'admin', 'V4Local', 'softwarestore.biz@gmail.com', '2020-11-07 17:11:53', NULL, NULL, '$2y$10$ETsBI.9vvIWpESNKaXtltO7.KwivrLelZvSo4fyeVtnTlwNOBchZO', 'GfX6VIKwqAACQHACN30SB6xFcTnBRp9ydYEaTCDnM4384T3ChRg3Se7ShQFd', NULL, 'uploads/avatar/EafwbwAaTa05vXeUWmQ5JrEFDz4WPIKYdSXgVbVR.png', NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-07 17:43:53', '2020-11-12 16:09:00'),
(10, NULL, NULL, 'staff', 'Pravarsh Shukla', 'pravarsh@v4local.in', NULL, NULL, NULL, '$2y$10$va3A2tZ6zG7hmnTm57JSbOJmrjGuM2yl8vxmP8ZbuJcg/hKxlWBQq', 'VtTwihtRU7y73oq4WFWnLyIqIgb3KBKDRbx2DerZQpW6Eq6wJujWLDzz5Lf4', NULL, NULL, NULL, NULL, NULL, NULL, '+919879203435', 0.00, 0, NULL, NULL, 0, '2020-11-11 23:43:08', '2020-11-11 23:43:08'),
(11, NULL, NULL, 'seller', 'Cool wear', 'hirvapshukla@gmail.com', '2020-11-12 06:49:55', 'eyJpdiI6IklJVnIzWWR2TFwvWUJxN1ZYb1oyN3BBPT0iLCJ2YWx1ZSI6IjdlUXE0cERUS2xGc1FuUkRhWFRmaFE9PSIsIm1hYyI6IjgxZDRkYTRlN2FiZDU5NGVjMzY4ZTJlOTczODZhODBlMzEzYzAyMjQ0ZGU4MzJhNGM3YTQxYTE0MzNkYTJmNjQifQ==', NULL, '$2y$10$UB70HHbEv6RYJLvINzA.ue62J0phmqvjLkvpOriLdeU72uleVgmAG', '9nElW6d8m8VKvqEQF90Pm1BzSgjIDSpIpKlXyzYFr7lmu6r3lv9tBQSdaGIG', NULL, 'uploads/GoffbRatu772AXifwo83Xiz5PBGOogwBnLY5CqNy.jpeg', NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-12 00:42:21', '2020-11-19 22:21:01'),
(12, NULL, NULL, 'customer', 'Nishith', 'nhs4learning@gmail.com', '2020-11-12 15:53:23', 'eyJpdiI6InN4MDZOMGdRTDVsWFp5TGpoTkZkQnc9PSIsInZhbHVlIjoiaHZmRGg0WXBjWXdnV0p4blFyVExjZz09IiwibWFjIjoiNzY5OTJhYjgzMmYyZDY4OTNkMDE5N2Q0YzRkNjFiMTkyZDEyMzM1MTg3YTVmMDBmNjA0YzBjNDViZTU3ODViYyJ9', NULL, '$2y$10$8PrcjDKQgxCUcht/hpjPSeOBWAvzMzTAbmYGum0ddynFSNG.Wn7U.', 'JlxVOwazVhA7GSTlz2AMxuDk0pVYaBrIBErHUQeTgLaiFUIvSwphp7iQI39g', NULL, 'uploads/users/I5gJ4WGHtAhjqfjEtcgIWYnEkAKjOxIHepQBTBK7.png', NULL, NULL, NULL, NULL, '7016311514', 0.00, 0, NULL, NULL, 0, '2020-11-12 15:50:33', '2020-11-12 16:07:00'),
(13, NULL, NULL, 'seller', 'Aardra Fashion', 'dristi.shukla@gmail.com', '2020-11-16 15:27:30', 'eyJpdiI6Ik05aHNsdVlCTGttY2VHVWRyVVJYbXc9PSIsInZhbHVlIjoiajByditxaWkxeFN3c1dORFVBSDhyZz09IiwibWFjIjoiNDg3ZjA5ODUwZDBhY2I1MTYzZjgzYThiMzJlMDIwY2Y5ODliODFhY2RiNmRmOWI2OTVmM2ZkZDFkYjE3Nzg4ZSJ9', NULL, '$2y$10$NhUrYg10Q1FUTP9ozX.uOO9CPlUhFpeAk0KTedzsJrp5JgCip8sPG', 'yqtmlQbHQ3wMDfN1yJvKkagFfy5KZIyu3hI2ZhZ82piwvzwCHxE6pnV4HdaW', NULL, 'uploads/eMBYHM4jW9jrbW18yphbH1lLqW5F3nQLDHuPQQpb.png', NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-16 15:26:14', '2020-11-19 22:34:46'),
(14, NULL, '103728220722586113910', 'customer', 'Atharv Shukla', 'atharvpshukla@gmail.com', '2020-11-16 16:11:30', NULL, NULL, NULL, 'OCOWXZAsWioFdZqAq4JUg54iO87kitqmLuzaDm76rcwOy75h7DU1SNJrm3hp', NULL, NULL, NULL, NULL, NULL, NULL, '7016210179', 0.00, 0, NULL, NULL, 0, '2020-11-16 16:14:30', '2020-11-16 16:15:47'),
(15, NULL, NULL, 'customer', 'Dib Sarkar', 'sarkardibivd@gmail.comm', '2020-11-16 23:02:51', 'eyJpdiI6IkJCSVhrZ1NLTnJ2eVIrbDdUaEtaVkE9PSIsInZhbHVlIjoiWFE5aDU5NjhRd1k2REpZOFkreWR2UT09IiwibWFjIjoiYzdjOGVlMmNmYzgwOGFmNWE4MmFiYWViMGQ5NjVkZDdjZDRjNjJiNjM0YjY0MTRlZjc5MWNmZGQ5ZDJmMjkzNCJ9', NULL, '$2y$10$BdJP5EnHNlnhNbFHJkxcYODdkZaRcGPXurmTE2AgYGVQGnqMqWlPe', 'ESliahPz9Ff8WFTloyZCKpCGI1p6xZ9RrlxBqeWMMPun3fv5bTbErEWR6J4G', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-16 22:04:33', '2020-11-16 23:02:51'),
(16, NULL, NULL, 'customer', 'Dib Sarkar', 'sarkardib052@gmail.comm', NULL, 'eyJpdiI6IjhJdGRtalo0V21wNkhrODdnQ3dYYWc9PSIsInZhbHVlIjoieXk4d3E0bWJPZFNwRW1KaExQd2ZIQT09IiwibWFjIjoiZWUyM2FlYmNmMDlmNjQ3YWNiMWUzYjMwNjM4YTc3MDkzNjU3NmFmZTJjMmNhNjAwNDMwMjIxODFlYTg0MTgwNCJ9', NULL, '$2y$10$G54BktWbppS9pVb99szPOu3ouWycClrFmFwQ6nR9YlEZr5k2N5kwO', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-16 23:10:03', '2020-11-16 23:10:03'),
(17, NULL, NULL, 'customer', 'Dib Sarkar', 'sarkardibivd@gmail.com', '2020-11-16 23:11:56', NULL, NULL, '$2y$10$o9/QAhjgsRYlAqNmEeT1Ie2krtx7iIiSZez/0D7lCmsw9wJbOakby', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-16 23:31:56', '2020-11-16 23:31:56'),
(18, NULL, NULL, 'customer', 'Tapan Sethi', 'sethitapan1@gmail.com', '2020-11-17 10:11:16', NULL, NULL, '$2y$10$CK9.c5nJiSqcgJvB2WPN4u7AZvqiBvZdHGCShDOv4iQPHc8cPZici', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-17 10:34:16', '2020-11-17 10:34:16'),
(19, NULL, NULL, 'customer', 'Tapan Sethi', 'tapansethi.2010@rediffmail.com', '2020-11-17 17:55:49', 'eyJpdiI6ImZHSk90aWdScHRSTXRFSHFHaERDeFE9PSIsInZhbHVlIjoibTVGc3F6R0Q5azkrK0lXTHZiUVF5Zz09IiwibWFjIjoiNjQ4ZDA5MWE4Njk4MmMzY2Q3ZTU1YmNlNDM0NGUxMTdhZDg3NzVhODdkZGY1ZWU0YjllMzVjYThkMDYxZGNkZSJ9', NULL, '$2y$10$.1cTBkjyxKIP1XnEZdjEqOni0SLfgdWjpZ8uqoVlVe0MLphvlcudq', '0M6C5THaRSFGchJhlDSyIrrOMWq3AA1sPkFC2IAbefD0qr573n0iBD8MrGUn', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-17 17:52:27', '2020-11-17 17:55:49'),
(22, NULL, NULL, 'seller', 'Reruns', 'bhujreruns@gmail.com', '2020-11-21 16:11:34', 'eyJpdiI6InRvblVsbExaeHF6MnRnWkw4T1pQWmc9PSIsInZhbHVlIjoiOVF1U0wyajZicUdzcUpHS282Ymw1QT09IiwibWFjIjoiZmM2NTllOTlkYWYwMDViY2E5OGFkYTY2NTllMWM3YjMzYjZjZGVhYzJjYjA2NzNkZWYxZDVmZDBlZDg4ZjE2NiJ9', NULL, '$2y$10$iq8EZwpw/yUbS734IIRSjOkRTOjLDLwMyxYJNDHT5SokaHkBNMWU2', 'wsqbYmbquC4Oqp7csMUOm07smqELnz42z895IdaHNjN3bR0sljAG7xVNJlA6', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-21 16:08:21', '2020-11-21 16:11:34'),
(23, NULL, NULL, 'customer', 'shalin', 'shalin.vm@rediffmail.com', '2020-11-21 16:11:53', NULL, NULL, '$2y$10$94TotoMDdX3P/XGXs1LKseEHmZspvGpB0ZZ8AnPfCKbEwV35PcoG6', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-21 16:35:53', '2020-11-21 16:35:53'),
(24, NULL, NULL, 'seller', 'Dreamz', 'dreamzshowroom@gmail.com', '2020-11-22 12:35:43', 'eyJpdiI6IlBDRG5qWjR5WThUdGwwd2tSdml0RXc9PSIsInZhbHVlIjoiam5iVUgxWDlnWk9BeUlPNU1RNmdYdz09IiwibWFjIjoiZmU2OGQwZTYzZWRjNDM2ZWQyMTFlMDdkMTY0YTlkNTNjZGFmNzNkMmFkZmVkMjYwZmYyMWMyMmJiNDBiNGNhYSJ9', NULL, '$2y$10$uf0rV/PdzIV8iABgmjI2xeZlBElSgWrqCBMEam2SPA3HfxlnDJ.au', 'ZGN0flbh9C1hd9j7ty1SGxWrhtAS4NE1RQgsYVU5W1oRjkxQYp1gCr5KiYU0', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-22 12:34:28', '2020-11-22 12:35:43'),
(25, NULL, NULL, 'seller', 'TRIN TRIN CYCLE', 'trintrincycle@gmail.com', '2020-11-22 12:58:49', 'eyJpdiI6Ik00M0l3TElBWnpRR200QU9QWG5wU1E9PSIsInZhbHVlIjoibjJGcU1MV2hWTGw4Vk85Yzk3WE9mUT09IiwibWFjIjoiZDVlM2E4YjJlNDc4OTY4YzVlZDZmM2VlMjdjMzViOWE3NDNhNzc2M2JmMzc0YWQ5N2QxN2RjZjMzMjYxOWZmZSJ9', NULL, '$2y$10$oHLrR3qpYQ.44dtOY9GJ9.DSQ9Mw5iDJ.wgRcpOsQ/pSpCQaMSy3e', 'Ent3GLYUSAMZgIDnufhVJ2pkqLPR0marwSWZUVA8mp6sRzkXukluzZK3Dttj', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-22 12:48:55', '2020-11-22 12:58:49'),
(26, NULL, NULL, 'seller', 'Angel Accessories', 'chandan.hitesh@yahoo.in', '2020-11-23 11:38:02', 'eyJpdiI6Im9Hbk5iNlA3MEFUdVpxa1JtaG43QXc9PSIsInZhbHVlIjoiNFQyOUI1MVlMU0prS2E5Q0JWSW04dz09IiwibWFjIjoiYzBjNzY0ODY4MzkzNzRjNTgxMzg1YjA3OWZmNTY4MzYyNDhkY2JkZGY2ZGZmYTU2ZTIxNTBlNTA4ZDg4YWE2MCJ9', NULL, '$2y$10$WaEue6iBLbCUFww35iGmre43HiLCm9Wvwt/mLa.i8Ioi8YhrRhsi.', '48EWbNYQbt7titnQ4BqePwUFQK19joHg9c6DsQ6qOChI3OozvkYdkUHEtaPB', NULL, 'uploads/MfAAA6cjwDiR2u1kYk91dYKDqkKF7ET0TUDxE1Vo.jpeg', NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-23 11:34:19', '2020-11-23 17:20:20'),
(27, NULL, NULL, 'seller', 'MM Creation', 'mehulmeghan@gmail.com', '2020-11-23 18:48:22', 'eyJpdiI6InhUblBaU2NsM3VLR05RTjAwUnRrWnc9PSIsInZhbHVlIjoiTTRiZDN2SE54RkRKXC9JMHh5dHJxOVE9PSIsIm1hYyI6IjMxNjdmNmUxYWM4Zjk5OGVjZGY3ODAwMjlkYWU5MjA0YTI2ZjhkMzdmYzYxMDZlYzBmNTRkNjg3MmFmYTU3YTIifQ==', NULL, '$2y$10$0KhMCx7h8DX7m0BxdZuve.TY5kxNML28KFwC4En7dMEx8mQNiSBP.', 'mTD2GVzLMKdRe8YUA14Krr1T3WnTj6gHw0taAnAntj1VGqRekMSoC5l9zI0U', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-23 18:45:26', '2020-11-23 18:48:22'),
(28, NULL, '105547687971369568033', 'customer', 'Vedant Vora', 'vedantvora333@gmail.com', '2020-11-24 15:11:25', NULL, NULL, NULL, 'X7YXYKCqrEpScB1DWWXCiHi1eXq8o16P3YHpw9DBqUQu6pa55NWvJJtgBhlt', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-24 15:11:25', '2020-11-24 15:11:25'),
(29, NULL, NULL, 'customer', 'Yash Maharaja', 'ajfinservice@gmail.com', '2020-11-24 17:54:54', 'eyJpdiI6IkV3akVuWHVZT2R4NlZxWUQxRnQ5Ync9PSIsInZhbHVlIjoiQ0pRbExBUHlHQ1p3NHp6TWdETWpjQT09IiwibWFjIjoiZGYxZjEyNTFmZDBlNmM1ZTkyY2ZkZGI1OWY2ZjNmNjM1NmI0MWNlZTYyOGUzMzhkOWI5ZWYzNGFlZTg3YmJhNiJ9', NULL, '$2y$10$bh/9Q4Fduqpritg5gplE9eXJDa6SRdsPXI.yohJ6KZtEFpDud08Qq', 'M8fNcZQmnPQPRO9EyOFR5GoJf5NTOcsh5JkCLQT1fCSfr6OQLWIfRbV0VQKI', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-24 17:50:53', '2020-11-24 17:54:54'),
(34, NULL, NULL, 'seller', 'K.U.THESHOP', 'kutheshop@gmail.com', '2020-11-27 00:36:39', 'eyJpdiI6IjZtdkZqN3hkb0NPbDNhSjFJNHNUNEE9PSIsInZhbHVlIjoiUUZOMVBHOCtGQlwvUHhFcHRlSytsdFE9PSIsIm1hYyI6ImYwYjYwNDFhNTk0MWYxZTA5NWVmYjU4MTk5NmVlMTJiZWExNWNhZjQwYzg3YWI5MjhlYjk0YWEzNDFkNjk2NzgifQ==', NULL, '$2y$10$yOTJNAE.vbortP89HjlNIOlzwJmo4VGqb3VlSoJhkNjb1de.dXXu6', 'rPOG3IfmiYCc6MNxKVqnrPe0JQ7rWG68Nd8CX9yZbpWW1jneUQ6DdYzrCAzy', NULL, 'uploads/Bgr3FCqweZeuEeYQsZ9Qudd5FjXe3AnYinExARTL.jpeg', NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-27 00:32:36', '2020-11-27 02:38:04'),
(35, NULL, NULL, 'seller', 'Shrujvi\'s Collection', 'shrujvicollection@gmail.com', '2020-11-27 12:51:40', 'eyJpdiI6IkFucFQyMlJ2M1hBenJkclR6eGx1MkE9PSIsInZhbHVlIjoiekFjbjNNbHM4MlBSWG1JV2JSckdmUT09IiwibWFjIjoiZDU4ZTNlMDQ1NmM3MmRlODAyYmMyYTBiNzk0MDczMmI2ZGZiYTIzYWEwMTJiNjQxNTc0ZjQzM2JlZWVhYmZmYSJ9', NULL, '$2y$10$4PebmijoDeaKJ4MKkuLKkuD14NeFtoIiOZXuHnlscLj2PTsgeC.Fm', 'YuQ2I61oy8MUQ2cAnKouPn7ZVFeAOqbWYJwRX0hEBfNXi90uXpGvnHgxgr5H', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-27 12:50:28', '2020-11-27 12:51:40'),
(36, NULL, NULL, 'seller', 'Mahek creation', 'heenatrivedi1184@gmail.com', NULL, 'eyJpdiI6IjJQVUdIMVR4VVJlbnpseU9TTW42dEE9PSIsInZhbHVlIjoiZlUyTmY1WTlOTVBydzhJZTQzWFViQT09IiwibWFjIjoiMmUxZDkzZGY0MDU0NTM1ZmE3OWRlYTMyZDQ1MmJlN2ZhYTUzYzNiNzkwZWMwNmQzOTkzOGZjMmYyOWQ4OWM5ZSJ9', NULL, '$2y$10$0t6XQ375iqWkgY4Ub0T6y.lFytZQqsrfF4NfLXuzrcI8f6JymptK6', 'o8yRqD9VrERqRBJ3PjRssCM9OWuHTV2qbXZyEK6tfjKtrHxaBshDfmdtTlP2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-27 19:10:14', '2020-11-27 19:24:54'),
(37, NULL, NULL, 'customer', 'Masakkali Shopping', 'masakkalishopping@gmail.com', '2020-11-28 11:58:41', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-28 11:58:41', '2020-11-28 11:58:41'),
(38, NULL, NULL, 'customer', 'Dib Sarkar', 'sarkardib101@gmail.com', '2020-11-28 12:41:03', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-28 12:41:03', '2020-11-28 12:41:03'),
(39, NULL, NULL, 'customer', 'Mili Biswal', 'biswalmili01@gmail.com', '2020-11-28 13:28:18', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-28 13:28:18', '2020-11-28 13:28:18'),
(40, NULL, NULL, 'customer', 'murielstewart.45690@gmail.com', 'murielstewart.45690@gmail.com', '2020-11-28 13:51:02', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 1, NULL, NULL, 0, '2020-11-28 13:51:02', '2020-12-03 10:33:31'),
(41, NULL, NULL, 'customer', 'JWJIYTW5NCVN4QY4O74GVTSFM4-00@cloudtestlabaccounts.com', 'JWJIYTW5NCVN4QY4O74GVTSFM4-00@cloudtestlabaccounts.com', '2020-11-28 21:37:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 1, NULL, NULL, 0, '2020-11-28 21:37:31', '2020-12-03 10:32:31'),
(42, NULL, NULL, 'customer', 'Dib Sarkar', 'sarkardib052@gmail.com', '2020-11-29 11:55:12', NULL, NULL, NULL, 'kEkQRplki9oR6HDBGMFcBnbpa3OVfNzg7PhBIRklZBFRNmyfYS95nIvaXNfW', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-29 11:55:12', '2020-11-29 11:55:12'),
(43, NULL, NULL, 'customer', 'pravarsh shukla', 'pravarsh@gmail.com', '2020-11-29 13:20:49', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-29 13:20:49', '2020-11-29 13:20:49'),
(44, NULL, NULL, 'customer', 'brettmoreno.14432@gmail.com', 'brettmoreno.14432@gmail.com', '2020-11-29 14:11:39', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 1, NULL, NULL, 0, '2020-11-29 14:11:39', '2020-12-03 10:33:20'),
(45, NULL, NULL, 'customer', 'Kanchi Shukla', 'kanchinshukla@gmail.com', '2020-11-29 16:16:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-29 16:16:31', '2020-11-29 16:16:31'),
(46, NULL, NULL, 'customer', 'tejas pathak', 'tejas.dhruti@gmail.com', '2020-11-29 20:43:56', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-29 20:43:56', '2020-11-29 20:43:56'),
(47, NULL, '110189427762556678162', 'customer', 'Jaydip Tripathi', 'tripathiju@gmail.com', '2020-11-29 22:11:10', NULL, NULL, NULL, 'ZAONM3nHA8pbn0Uo5e2VIOs5T99nEWV02T3oBG7wn0iv0fIET1zJzXJ2Elmq', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-29 22:59:10', '2020-11-29 22:59:10'),
(48, NULL, NULL, 'customer', 'SUSHMA VASAVDA MANKAD', 'sushma.vasavda@gmail.com', NULL, 'eyJpdiI6IkNiTzNpaDNwRlM5OUtUZncxdDlMQkE9PSIsInZhbHVlIjoiTndPRjVHR0UxbU1IbnVkTlo1ZWxFUT09IiwibWFjIjoiMjk4Zjc0ZmY2N2MzMDFmZTNkMTgzODE5ZTBiZDE1YTVmNWU0NWZiOTNkZDFlYTQwNjk1YTE1MDUzOTI5MjUzNiJ9', NULL, '$2y$10$Ghe.pB2gLeNf8MzJngVVmOnMed1OhM6TDhFK9xh/zWE./QqMwnzte', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-11-30 08:58:31', '2020-11-30 09:05:06'),
(49, NULL, NULL, 'customer', 'freddieobrien.88400@gmail.com', 'freddieobrien.88400@gmail.com', '2020-12-04 19:44:46', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 1, NULL, NULL, 0, '2020-12-04 19:44:46', '2020-12-10 22:05:33'),
(50, NULL, NULL, 'customer', 'Shruti', 'shrutihathi509@gmail.com', NULL, 'eyJpdiI6IituTzJwc1hLUDg1aVNDYXJPb09NYnc9PSIsInZhbHVlIjoiXC95d1lBamRYaEVJbWtJVlcraFZcL09nPT0iLCJtYWMiOiI4ZGY3NzQ1NTllYTE5MzVkOTNmNmFhYTlkNWRlYjFkNjM5NjRmOTc2YWNhNWNiOGMyYjAyMjliZjUyZDYxY2M5In0=', NULL, '$2y$10$SmnT2f9oWYYA06ocRggZiuFB262SafM5tlU4oAsD3ccTYOSOIY/C.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-12-05 11:23:08', '2020-12-05 11:23:08'),
(51, NULL, NULL, 'customer', 'rubygonzales.32373@gmail.com', 'rubygonzales.32373@gmail.com', '2020-12-07 13:23:56', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-12-07 13:23:56', '2020-12-07 13:23:56'),
(52, NULL, NULL, 'seller', 'Hatkesh fashion', 'ashlesha.vora@gmail.com', '2020-12-16 11:41:48', 'eyJpdiI6ImlGNXROaDZUeWpNakVMYWpPKzNRV0E9PSIsInZhbHVlIjoiYXRzWU42OGw4dk1QUytDSnptbWt5Zz09IiwibWFjIjoiM2YzYWY5YzFmNjc0NjNhMTI1NzgyM2VhOWY5ODVkYmFjMmVmYzI3NmZjYmQyNWE3MDYzMGNjNDMxYTY3YTVmYyJ9', NULL, '$2y$10$QHN2sgJ8lhDvXx0OH0XU2ee0G7uSK9L1.kA/i2WVryd1lPNCVJ5bS', 'UCoIIYNBCAzogNakYT0FNj4aIz9koMMiWDtRwWE33z1gBtbc7PgsZHOYwFgx', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-12-12 10:55:18', '2020-12-16 11:41:48'),
(53, NULL, NULL, 'seller', 'Hasti collection', 'mehulvaishnav03@gmail.com', '2020-12-20 11:30:22', 'eyJpdiI6InhwU3NxRFwvSXo3UkMzMlZaRFwveXBjZz09IiwidmFsdWUiOiJhYnk1XC9CNHp1akZZblVmZTZCenJhdz09IiwibWFjIjoiNWZkNDc2M2UzZDg5YTIwMjgxMDMxODg1MTdhMWM4NTFlNDVhYmE4Zjk5MWJmNjdjM2U4OTUzYjhmMzc0ZTBkNiJ9', NULL, '$2y$10$rdnGN/Td7Mb7JAmQIaJ8vOTFCSJKr.CNjtZIQ0s4JQ0.6mo4hdzlS', 'v6dxhYI4YLcMlJC2pxCBhbdik5pGcw79nJJTTRodJGSqxIkLXEcPxDBUawWu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-12-14 22:20:39', '2020-12-20 13:09:10'),
(55, NULL, NULL, 'seller', 'Syscare', 'syscare1@gmail.com', NULL, 'eyJpdiI6IkVWalhSOERSWW4zdVY5R1ludk1xV2c9PSIsInZhbHVlIjoiTmMxS1ozR1I1bFVSNEdTYUVUb3pIZz09IiwibWFjIjoiNTllNWZhMWNhMWMzNWQ1MDQzYmZiZjliYjU4NjMwZGEzZWQxNzZiYjI3YzE1NWQ0MTIyMjQwZWVkOGU4Nzc3YyJ9', NULL, '$2y$10$YdK1zgONzAeS3WXTvB6BKu8dFVKA6hv6adGcsk/2YzyrvPLURAac2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-12-16 19:16:29', '2020-12-16 19:16:30'),
(56, NULL, NULL, 'customer', 'Jalpa Joshi', 'nims.icipru@gmail.com', NULL, 'eyJpdiI6IjgxN2dQZXJ4Ym1hR0hZUjZHdWk4Q1E9PSIsInZhbHVlIjoiWW5jODZmMndJblowWmc4XC96WE0xOUE9PSIsIm1hYyI6IjBjNWUxMDFiYmU5NGU2NTVkOGMzZmY3NGEzYzk2MjQ0ZDc1MDZmNGYxZDU4NDlkNWI3NTg2N2Y2ZGZiNjQ5MjkifQ==', NULL, '$2y$10$UWn4FoqnZaftRMBAj1ZjoOT3nWn6AQA05AFZtMW3a.hyCgjC2sTUy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-12-18 11:03:27', '2020-12-18 11:03:27'),
(58, NULL, NULL, 'seller', 'V.V Fashion', 'nims.icicipru@gmail.com', '2020-12-18 17:20:18', 'eyJpdiI6ImtLbEVFS2xyZmwzaFpyOGhSdk8xdmc9PSIsInZhbHVlIjoib1RrRjZmd25IUHZJWnRXVG1nVlZ0dz09IiwibWFjIjoiNDliM2YyNDIxN2NlODUwYjk5MmZlYzRkODZlODIwMjkxYmEwOWY1MDUyNWRmNTM0ODczN2Q5N2Y0OGZmZTUxZSJ9', NULL, '$2y$10$KvemYNWfv9PNrwlSFCUGLeqvcbIihbUfXBL.nKgywYitjRl5572YG', 'wivtysUZzHXBFJ6RCMxOJJwA4qeYysb0R2YxtSm7Fj1PoOrep5erj5fOSq89', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-12-18 14:35:49', '2020-12-18 17:20:18'),
(59, NULL, NULL, 'customer', 'ebonywalton.27042@gmail.com', 'ebonywalton.27042@gmail.com', '2020-12-23 00:00:56', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2020-12-23 00:00:56', '2020-12-23 00:00:56'),
(60, NULL, NULL, 'seller', 'Aarshvee', 'vinita247@gmail.com', NULL, 'eyJpdiI6IjExRE80K1dPRWUrZWZtUHcyeklcL29nPT0iLCJ2YWx1ZSI6ImI3YjEwREJWakVUU042bHNrNlRKK1E9PSIsIm1hYyI6IjY4NGE1MTE1YWU0NzAwYzkyZmZhYTk4NTU3YzY1MTE4NjkwYjQ2ZGQ2YmI4M2ZhNmExNTY5OGQwOTVjYjEyZGUifQ==', NULL, '$2y$10$Hgbq3i7eM4HNvwPbln7CeOG1HAjKSH63v3139yjs7onq.Y0uxitPy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2021-01-01 18:41:51', '2021-01-01 18:41:51'),
(61, NULL, NULL, 'seller', 'Mruga_creation', 'mruga.anjaria@gmail.com', '2021-02-20 01:42:13', 'eyJpdiI6IjNORWZ4Z2xnVkZLclV5cjFNdWtYc0E9PSIsInZhbHVlIjoibUJZRGJtUXVVeTZNTUxxRzF3elJSZz09IiwibWFjIjoiMjBhMjg2ZTM5ZjYwMGJiY2ZhOTRkMDZlYTc5MjgwMWY0ZjUxNzAwOWQ2MjJkNTljMTc5ZDM5Y2Y0M2E2YzQ5MCJ9', NULL, '$2y$10$DlpEf5Gn6O3Q5lXqZLWhnuPThb/kPYvRSxe49twqi0NCo5aXfUHqq', 'Y9km6PjAgeG85gyLN9P7uz4utchiRJTzqbxrcHE5zvowrITeJQ9pqE1intIA', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2021-02-12 14:33:42', '2021-02-20 01:42:13'),
(62, NULL, NULL, 'customer', 'Tapan Sethi', 'tapansethi090@gmail.com', NULL, 'eyJpdiI6ImtVakF4eGNHc21MSXlGOEtFSnV5SFE9PSIsInZhbHVlIjoialFrK3N0NjhYZ3ZBbnppdUMwWnB4dz09IiwibWFjIjoiZWY2NmI0ZTRlMTFkNzhmM2QxNzUyOTc5ZjY1YjUwNzlkMWFmYzllYTRlYWVlYTViNDYwMjdlMGZlNzQ0MTM2YiJ9', NULL, '$2y$10$NbbwIPCpsvSVCl5lPn/9L.z8hT1dp/e745EwVQYJUownu0vQjXn5e', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 0, NULL, NULL, 0, '2022-02-07 16:49:22', '2022-02-07 16:53:08');

-- --------------------------------------------------------

--
-- Table structure for table `wallets`
--

CREATE TABLE `wallets` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` double(8,2) NOT NULL,
  `payment_method` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `payment_details` longtext COLLATE utf8_unicode_ci,
  `approval` int(1) NOT NULL DEFAULT '0',
  `offline_payment` int(1) NOT NULL DEFAULT '0',
  `reciept` varchar(150) COLLATE utf8_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `wishlists`
--

CREATE TABLE `wishlists` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `wishlists`
--

INSERT INTO `wishlists` (`id`, `user_id`, `product_id`, `created_at`, `updated_at`) VALUES
(1, 12, 2, '2020-11-12 15:53:12', '2020-11-12 15:53:12'),
(2, 13, 12, '2020-11-17 08:39:41', '2020-11-17 08:39:41'),
(3, 13, 13, '2020-11-21 18:49:09', '2020-11-21 18:49:09'),
(4, 12, 43, '2020-11-29 13:48:52', '2020-11-29 13:48:52'),
(5, 44, 46, '2020-11-29 14:12:35', '2020-11-29 14:12:35'),
(6, 35, 46, '2020-11-29 22:27:08', '2020-11-29 22:27:08'),
(7, 43, 118, '2020-12-07 05:47:19', '2020-12-07 05:47:19');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addons`
--
ALTER TABLE `addons`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `addresses`
--
ALTER TABLE `addresses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `affiliate_configs`
--
ALTER TABLE `affiliate_configs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `affiliate_options`
--
ALTER TABLE `affiliate_options`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `affiliate_payments`
--
ALTER TABLE `affiliate_payments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `affiliate_users`
--
ALTER TABLE `affiliate_users`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `affiliate_withdraw_requests`
--
ALTER TABLE `affiliate_withdraw_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `app_settings`
--
ALTER TABLE `app_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `attributes`
--
ALTER TABLE `attributes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `banners`
--
ALTER TABLE `banners`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `brands`
--
ALTER TABLE `brands`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `business_settings`
--
ALTER TABLE `business_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `colors`
--
ALTER TABLE `colors`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `countries`
--
ALTER TABLE `countries`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `coupons`
--
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `coupon_usages`
--
ALTER TABLE `coupon_usages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `currencies`
--
ALTER TABLE `currencies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `customer_packages`
--
ALTER TABLE `customer_packages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `customer_package_payments`
--
ALTER TABLE `customer_package_payments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `customer_products`
--
ALTER TABLE `customer_products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `flash_deals`
--
ALTER TABLE `flash_deals`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `flash_deal_products`
--
ALTER TABLE `flash_deal_products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `general_settings`
--
ALTER TABLE `general_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `home_categories`
--
ALTER TABLE `home_categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `languages`
--
ALTER TABLE `languages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `links`
--
ALTER TABLE `links`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `manual_payment_methods`
--
ALTER TABLE `manual_payment_methods`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `oauth_access_tokens`
--
ALTER TABLE `oauth_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `oauth_access_tokens_user_id_index` (`user_id`);

--
-- Indexes for table `oauth_auth_codes`
--
ALTER TABLE `oauth_auth_codes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `oauth_clients`
--
ALTER TABLE `oauth_clients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `oauth_clients_user_id_index` (`user_id`);

--
-- Indexes for table `oauth_personal_access_clients`
--
ALTER TABLE `oauth_personal_access_clients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `oauth_personal_access_clients_client_id_index` (`client_id`);

--
-- Indexes for table `oauth_refresh_tokens`
--
ALTER TABLE `oauth_refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `oauth_refresh_tokens_access_token_id_index` (`access_token_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `order_details`
--
ALTER TABLE `order_details`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pages`
--
ALTER TABLE `pages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD KEY `password_resets_email_index` (`email`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pickup_points`
--
ALTER TABLE `pickup_points`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `policies`
--
ALTER TABLE `policies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `product_stocks`
--
ALTER TABLE `product_stocks`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `searches`
--
ALTER TABLE `searches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sellers`
--
ALTER TABLE `sellers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `seller_packages`
--
ALTER TABLE `seller_packages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `seller_withdraw_requests`
--
ALTER TABLE `seller_withdraw_requests`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `seo_settings`
--
ALTER TABLE `seo_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `shops`
--
ALTER TABLE `shops`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sliders`
--
ALTER TABLE `sliders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `subscribers`
--
ALTER TABLE `subscribers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `sub_categories`
--
ALTER TABLE `sub_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_category_id` (`category_id`);

--
-- Indexes for table `sub_sub_categories`
--
ALTER TABLE `sub_sub_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_sub_category_id` (`sub_category_id`);

--
-- Indexes for table `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ticket_replies`
--
ALTER TABLE `ticket_replies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- Indexes for table `wallets`
--
ALTER TABLE `wallets`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `wishlists`
--
ALTER TABLE `wishlists`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addons`
--
ALTER TABLE `addons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `addresses`
--
ALTER TABLE `addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `affiliate_configs`
--
ALTER TABLE `affiliate_configs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `affiliate_options`
--
ALTER TABLE `affiliate_options`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `affiliate_payments`
--
ALTER TABLE `affiliate_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `affiliate_users`
--
ALTER TABLE `affiliate_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `affiliate_withdraw_requests`
--
ALTER TABLE `affiliate_withdraw_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `app_settings`
--
ALTER TABLE `app_settings`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `attributes`
--
ALTER TABLE `attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `banners`
--
ALTER TABLE `banners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `brands`
--
ALTER TABLE `brands`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `business_settings`
--
ALTER TABLE `business_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT for table `carts`
--
ALTER TABLE `carts`
  MODIFY `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `colors`
--
ALTER TABLE `colors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=144;

--
-- AUTO_INCREMENT for table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `countries`
--
ALTER TABLE `countries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=297;

--
-- AUTO_INCREMENT for table `coupons`
--
ALTER TABLE `coupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `coupon_usages`
--
ALTER TABLE `coupon_usages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `currencies`
--
ALTER TABLE `currencies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `customer_packages`
--
ALTER TABLE `customer_packages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customer_package_payments`
--
ALTER TABLE `customer_package_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customer_products`
--
ALTER TABLE `customer_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `flash_deals`
--
ALTER TABLE `flash_deals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `flash_deal_products`
--
ALTER TABLE `flash_deal_products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `general_settings`
--
ALTER TABLE `general_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `home_categories`
--
ALTER TABLE `home_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `languages`
--
ALTER TABLE `languages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `links`
--
ALTER TABLE `links`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `manual_payment_methods`
--
ALTER TABLE `manual_payment_methods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `oauth_clients`
--
ALTER TABLE `oauth_clients`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `oauth_personal_access_clients`
--
ALTER TABLE `oauth_personal_access_clients`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `order_details`
--
ALTER TABLE `order_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `pages`
--
ALTER TABLE `pages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pickup_points`
--
ALTER TABLE `pickup_points`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `policies`
--
ALTER TABLE `policies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=163;

--
-- AUTO_INCREMENT for table `product_stocks`
--
ALTER TABLE `product_stocks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=312;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `searches`
--
ALTER TABLE `searches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `sellers`
--
ALTER TABLE `sellers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `seller_packages`
--
ALTER TABLE `seller_packages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `seller_withdraw_requests`
--
ALTER TABLE `seller_withdraw_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `seo_settings`
--
ALTER TABLE `seo_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `shops`
--
ALTER TABLE `shops`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `sliders`
--
ALTER TABLE `sliders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `subscribers`
--
ALTER TABLE `subscribers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `sub_categories`
--
ALTER TABLE `sub_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `sub_sub_categories`
--
ALTER TABLE `sub_sub_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `tickets`
--
ALTER TABLE `tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `ticket_replies`
--
ALTER TABLE `ticket_replies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `wallets`
--
ALTER TABLE `wallets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wishlists`
--
ALTER TABLE `wishlists`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
