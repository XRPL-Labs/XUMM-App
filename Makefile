.PHONY: pre-run pre-build clean
.PHONY: check-style
.PHONY: start stop
.PHONY: run run-ios run-android
.PHONY: build build-ios build-android unsigned-ios unsigned-android ios-sim-x86_64
.PHONY: build-pr can-build-pr prepare-pr
.PHONY: test help

OS := $(shell sh -c 'uname -s 2>/dev/null')
SIMULATOR = iPhone 11 Pro Max

node_modules: package.json
	@if ! [ $(shell which yarn 2> /dev/null) ]; then \
		echo "yarn is not installed https://yarnpkg.com"; \
		exit 1; \
	fi

	@echo Getting Javascript dependencies
	@yarn install

yarn-ci: package.json
	@if ! [ $(shell which yarn 2> /dev/null) ]; then \
		echo "yarn is not installed https://yarnpkg.com"; \
		exit 1; \
	fi

	@echo Getting Javascript dependencies
	@yarn install --frozen-lockfile

.podinstall:
ifeq ($(OS), Darwin)
	@echo "Required version of Cocoapods is not installed"
	@echo Installing gems;
	@bundle install
	@echo Getting Cocoapods dependencies;
	@cd ios && bundle exec pod install;
endif
	@touch $@

build-env:
	@echo "Generating Google Services files"
	@./scripts/build-env.sh

pre-run: | node_modules .podinstall build-env ## Installs dependencies

pre-build: | yarn-ci .podinstall build-env ## Install dependencies before building

check-style: node_modules ## Runs eslint
	@echo Checking for style guide compliance
	@yarn run check

clean: ## Cleans dependencies, previous builds and temp files
	@echo Cleaning started

	@rm -f .podinstall
	@rm -rf ios/Pods
	@rm -rf node_modules
	@rm -rf ios/build
	@rm -rf android/app/build

	@echo Cleanup finished

post-install:
	@./scripts/post-install.sh

start: | pre-run ## Starts the React Native packager server
	$(call start_packager)

stop: ## Stops the React Native packager server
	$(call stop_packager)

check-device-ios:
	@if ! [ $(shell which xcodebuild) ]; then \
		echo "xcode is not installed"; \
		exit 1; \
	fi
	@if ! [ $(shell which watchman) ]; then \
		echo "watchman is not installed"; \
		exit 1; \
	fi

check-device-android:
	@if ! [ $(ANDROID_HOME) ]; then \
		echo "ANDROID_HOME is not set"; \
		exit 1; \
	fi
	@if ! [ $(shell which adb 2> /dev/null) ]; then \
		echo "adb is not installed"; \
		exit 1; \
	fi

	@echo "Connect your Android device or open the emulator"
	@adb wait-for-device

	@if ! [ $(shell which watchman 2> /dev/null) ]; then \
		echo "watchman is not installed"; \
		exit 1; \
	fi


run: run-ios ## alias for run-ios

run-ios: | check-device-ios pre-run ## Runs the app on an iOS simulator
	@if [ $(shell ps -ef | grep -i "cli.js start" | grep -civ grep) -eq 0 ]; then \
		echo Starting React Native packager server; \
		yarn start & echo Running iOS app in development; \
		if [ ! -z "${SIMULATOR}" ]; then \
			react-native run-ios --simulator="${SIMULATOR}"; \
		else \
			react-native run-ios; \
		fi; \
		wait; \
	else \
		echo Running iOS app in development; \
		if [ ! -z "${SIMULATOR}" ]; then \
			react-native run-ios --simulator="${SIMULATOR}"; \
		else \
			react-native run-ios; \
		fi; \
	fi

run-android: | check-device-android pre-run ## Runs the app on an Android emulator or dev device
	@if [ $(shell ps -ef | grep -i "cli.js start" | grep -civ grep) -eq 0 ]; then \
        echo Starting React Native packager server; \
    	yarn start & echo Running Android app in development; \
	if [ ! -z ${VARIANT} ]; then \
    		react-native run-android --no-packager --variant=${VARIANT}; \
    	else \
    		react-native run-android --no-packager; \
    	fi; \
    	wait; \
    else \
    	echo Running Android app in development; \
        if [ ! -z ${VARIANT} ]; then \
			react-native run-android --no-packager --variant=${VARIANT}; \
		else \
			react-native run-android --no-packager; \
		fi; \
    fi

build: | stop pre-build check-style ## Builds the app for Android & iOS
	$(call start_packager)
	@echo "Building App"
	@cd fastlane && BABEL_ENV=production NODE_ENV=production bundle exec fastlane build
	$(call stop_packager)


build-ios: | stop pre-build check-style ## Builds the iOS app
	$(call start_packager)
	@echo "Building iOS app"
	@cd fastlane && BABEL_ENV=production NODE_ENV=production bundle exec fastlane ios build
	$(call stop_packager)

build-android: | stop pre-build check-style prepare-android-build ## Build the Android app
	$(call start_packager)
	@echo "Building Android app"
	@cd fastlane && BABEL_ENV=production NODE_ENV=production bundle exec fastlane android build
	$(call stop_packager)

unsigned-ios: stop pre-build check-style ## Build an unsigned version of the iOS app
	$(call start_packager)
	@cd fastlane && NODE_ENV=production bundle exec fastlane ios unsigned
	$(call stop_packager)

ios-sim-x86_64: stop pre-build check-style ## Build an unsigned x86_64 version of the iOS app for iPhone simulator
	$(call start_packager)
	@echo "Building unsigned x86_64 iOS app for iPhone simulator"
	@cd fastlane && NODE_ENV=production bundle exec fastlane ios unsigned
	@mkdir -p build-ios
	@cd ios/ && xcodebuild -workspace XUMM.xcworkspace/ -scheme XUMM -arch x86_64 -sdk iphonesimulator -configuration Release -parallelizeTargets -resultBundlePath ../build-ios/result -derivedDataPath ../build-ios/ ENABLE_BITCODE=NO CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO ENABLE_BITCODE=NO
	@cd build-ios/Build/Products/Release-iphonesimulator/ && zip -r XUMM-simulator-x86_64.app.zip XUMM.app/
	@mv build-ios/Build/Products/Release-iphonesimulator/XUMM-simulator-x86_64.app.zip .
	@rm -rf build-ios/
	@cd fastlane && bundle exec fastlane upload_file_to_s3 file:XUMM-simulator-x86_64.app.zip os_type:iOS
	$(call stop_packager)

unsigned-android: stop pre-build check-style prepare-android-build ## Build an unsigned version of the Android app
	@cd fastlane && NODE_ENV=production bundle exec fastlane android unsigned
	
	
pre-e2e: | pre-build  ## build for e2e test
	@yarn detox build e2e --configuration ios.sim.debug

test: | pre-run check-style ## Runs tests
	@yarn test

test-e2e: | pre-run pre-e2e ## Runs e2e tests
	@yarn cucumber-js ./e2e --configuration ios.sim.debug --cleanup --debug-synchronization 200

build-pr: | can-build-pr stop pre-build check-style ## Build a PR from the XUMM repo
	$(call start_packager)
	@echo "Building App from PR ${PR_ID}"
	@cd fastlane && BABEL_ENV=production NODE_ENV=production bundle exec fastlane build_pr pr:PR-${PR_ID}
	$(call stop_packager)

can-build-pr:
	@if [ -z ${PR_ID} ]; then \
		echo a PR number needs to be specified; \
		exit 1; \
	fi

## Help documentation https://marmelab.com/blog/2016/02/29/auto-documented-makefile.html
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

define start_packager
	@if [ $(shell ps -ef | grep -i "cli.js start" | grep -civ grep) -eq 0 ]; then \
		echo Starting React Native packager server; \
		yarn start & echo; \
	else \
		echo React Native packager server already running; \
	fi
endef

define stop_packager
	@echo Stopping React Native packager server
	@if [ $(shell ps -ef | grep -i "cli.js start" | grep -civ grep) -eq 1 ]; then \
		ps -ef | grep -i "cli.js start" | grep -iv grep | awk '{print $$2}' | xargs kill -9; \
		echo React Native packager server stopped; \
	else \
		echo No React Native packager server running; \
	fi
endef