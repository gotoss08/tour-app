CLIENT_FOLDER="client/src/js"
LIBS_FOLDER="client/libs/js"
DIST_FOLDER="public/js"

rm -rf $DIST_FOLDER
yarn babel $CLIENT_FOLDER -d $DIST_FOLDER
cp -r $LIBS_FOLDER/* $DIST_FOLDER
