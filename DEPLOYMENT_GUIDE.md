# Charted Mobile App Deployment Guide

## Prerequisites

### For iOS (Apple App Store):
- **Apple Developer Account** ($99/year): https://developer.apple.com/
- **Mac computer** with Xcode installed
- **iOS Developer Certificate** and provisioning profiles
- **App Store Connect** access for app submission

### For Android (Google Play Store):
- **Google Play Console Account** ($25 one-time registration fee)
- **Android Studio** installed
- **Google Play App Signing** key setup
- **Android SDK** tools

## Step 1: Local Development Setup

1. **Export from Lovable**: Use "Export to GitHub" button
2. **Clone Repository**: 
   ```bash
   git clone [your-repo-url]
   cd charted
   npm install
   ```

3. **Initialize Capacitor**:
   ```bash
   npx cap init
   ```

4. **Add Platforms**:
   ```bash
   npx cap add ios
   npx cap add android
   ```

5. **Build and Sync**:
   ```bash
   npm run build
   npx cap sync
   ```

## Step 2: iOS App Store Submission

### A. Prepare iOS Build
1. **Open iOS Project**:
   ```bash
   npx cap open ios
   ```

2. **Configure in Xcode**:
   - Set **Team** and **Bundle Identifier**
   - Update **Display Name** to "Charted"
   - Set **Version** (e.g., 1.0.0) and **Build** number
   - Add app icons (AppIcon.appiconset)

3. **Archive Build**:
   - Product → Archive
   - Distribute App → App Store Connect
   - Upload to App Store

### B. App Store Connect Setup
1. **Create App Record**:
   - Bundle ID: `app.lovable.0257cb44f3674f7081c02d1669f7d11a`
   - App Name: "Charted"
   - SKU: charted-app-2024

2. **App Information**:
   - **Category**: Finance or Social Networking
   - **Description**: 
     ```
     Charted is the social prediction platform where traders connect, 
     share insights, and predict market movements together. Join a 
     community of traders making informed predictions and following 
     market trends in real-time.
     ```
   - **Keywords**: trading, prediction, social, finance, markets, futures
   - **Privacy Policy URL**: [Required - create one]

3. **Screenshots Required**:
   - iPhone 6.7": 1290×2796 (3 minimum)
   - iPhone 6.5": 1242×2688 (3 minimum)  
   - iPhone 5.5": 1242×2208 (3 minimum)
   - iPad Pro 12.9": 2048×2732 (2 minimum)

4. **App Review Information**:
   - Demo account credentials (if needed)
   - Review notes explaining app functionality
   - Contact information

### C. Submit for Review
- **TestFlight**: Test with beta users first
- **App Review**: Submit for Apple review (typically 24-48 hours)
- **Release**: Choose automatic or manual release

## Step 3: Google Play Store Submission

### A. Prepare Android Build
1. **Open Android Project**:
   ```bash
   npx cap open android
   ```

2. **Configure Build**:
   - Update `android/app/build.gradle`:
     ```gradle
     android {
         compileSdkVersion 34
         defaultConfig {
             applicationId "app.lovable.charted"
             minSdkVersion 22
             targetSdkVersion 34
             versionCode 1
             versionName "1.0.0"
         }
     }
     ```

3. **Generate Signed APK/AAB**:
   - Build → Generate Signed Bundle/APK
   - Create keystore or use existing
   - Build release AAB (Android App Bundle)

### B. Google Play Console Setup
1. **Create App**:
   - App name: "Charted"
   - Default language: English (US)
   - App or game: App
   - Free or paid: Free

2. **Store Listing**:
   - **App description**:
     ```
     Charted brings social trading to the next level. Connect with fellow 
     traders, share market predictions, and follow real-time insights from 
     a vibrant community. Make informed trading decisions with collective 
     intelligence and social validation.
     
     Features:
     • Social prediction sharing
     • Real-time market data
     • Community discussions
     • Trading insights and analysis
     • Portfolio tracking
     ```
   - **Category**: Finance
   - **Tags**: trading, social, finance, predictions

3. **Graphics Assets**:
   - **App icon**: 512×512 PNG
   - **Feature graphic**: 1024×500 PNG
   - **Screenshots**: 
     - Phone: 320dp to 3840dp (16:9 to 2:1 ratio)
     - 7-inch tablet: 1024×600 to 7680×4320
     - 10-inch tablet: 1024×768 to 7680×4320

### C. Release Setup
1. **Content Rating**: Complete questionnaire
2. **Target Audience**: Select appropriate age groups
3. **Privacy Policy**: Required URL
4. **App Signing**: Use Google Play App Signing
5. **Release**: Upload AAB and publish

## Step 4: Production Configuration

### Update Capacitor Config for Production:
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'app.lovable.0257cb44f3674f7081c02d1669f7d11a',
  appName: 'charted',
  webDir: 'dist',
  // Remove server.url for production
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1a1a1a",
      showSpinner: false
    }
  }
};
```

## Step 5: Required Assets Checklist

### Icons:
- [x] App icon 512×512 (generated)
- [ ] iOS app icons (multiple sizes needed)
- [ ] Android adaptive icons
- [ ] Splash screen images

### Store Assets:
- [ ] Privacy policy website
- [ ] App screenshots (all required sizes)
- [ ] App description copy
- [ ] Feature graphics
- [ ] App preview videos (optional but recommended)

### Legal:
- [ ] Terms of service
- [ ] Privacy policy
- [ ] Data collection disclosure
- [ ] Age rating questionnaire completion

## Step 6: Post-Launch

### Analytics & Monitoring:
- **App Store Connect**: Download and revenue analytics
- **Google Play Console**: User acquisition and engagement
- **Crash Reporting**: Integrate Sentry or similar
- **User Feedback**: Monitor reviews and ratings

### Updates:
- **Version Control**: Tag releases in Git
- **Release Notes**: Document changes for users
- **Phased Rollouts**: Use gradual release features
- **A/B Testing**: Test new features with user segments

## Estimated Timeline

- **Setup & Testing**: 1-2 days
- **iOS Review**: 1-3 days (after submission)
- **Android Review**: 2-3 hours to 7 days
- **Total Time to Live**: 3-7 days from submission

## Support Resources

- **Apple Developer**: https://developer.apple.com/support/
- **Google Play Support**: https://support.google.com/googleplay/android-developer/
- **Capacitor Docs**: https://capacitorjs.com/docs/
- **App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/

## Common Issues & Solutions

### iOS:
- **Code signing errors**: Update certificates and provisioning profiles
- **App rejection**: Review App Store guidelines carefully
- **Build failures**: Check Xcode version compatibility

### Android:
- **APK upload errors**: Use AAB format instead of APK
- **Target SDK warnings**: Update to latest Android API level
- **Permission issues**: Review AndroidManifest.xml

---

**Ready to Launch!** 🚀 Follow this guide step-by-step to get Charted live on both app stores.