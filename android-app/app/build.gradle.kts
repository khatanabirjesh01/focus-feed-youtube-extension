plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.focusfeed.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.focusfeed.shield"
        minSdk = 24
        targetSdk = 34
        versionCode = 3
        versionName = "2.1.0"
    }

    signingConfigs {
        create("release") {
            val keystoreFile = rootProject.file("focusfeed-release.jks")
            if (keystoreFile.exists()) {
                storeFile = keystoreFile
                storePassword = "focusfeed123"
                keyAlias = "focusfeed"
                keyPassword = "focusfeed123"
            }
            enableV1Signing = true
            enableV2Signing = true
            enableV3Signing = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            isDebuggable = false
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            applicationIdSuffix = ".debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    testImplementation("junit:junit:4.13.2")
}
