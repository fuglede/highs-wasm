cd build
emcmake cmake ../HiGHS -DOPENMP=OFF -DFAST_BUILD=OFF -DSHARED=OFF
emmake make -j8 libhighs
emcc -O3 -s EXPORTED_FUNCTIONS="['_Highs_mipCall']" -s EXPORT_NAME="Highs" --post-js ../post.js -s EXTRA_EXPORTED_RUNTIME_METHODS="['cwrap','setValue','getValue']" -sMODULARIZE -s ALLOW_MEMORY_GROWTH=1 -flto lib/*.a -o highs.js
