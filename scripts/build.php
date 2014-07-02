<?php
date_default_timezone_set('America/Sao_Paulo');
chdir(realpath(dirname(__FILE__)));
$build = file_get_contents('../build.json');
$l = '../server/build/lazy.cache.load.js';

$lazyCache = file_get_contents($l);
$lazyCacheMin = shell_exec("closure {$l}");

$inputHtml = file_get_contents('../server/build/index.html');
$build = json_decode($build, true);
foreach (array('development', 'production')  as $env) {
    $output = $build[$env];
    foreach (array('css', 'js') as $type) {
        if (!array_key_exists($type, $output)) {
            $output[$type] = $build['default'][$type];
        }
    }
    
    $outputHtml = str_replace('[ INSERT LAZYLOAD SCRIPT URL HERE ]', $output['js']['lazyload'], $inputHtml);
    $outputHtml = str_replace('[ INSERT BUILD OBJECT HERE ]', json_encode($output), $outputHtml);
    
    $outputHtml = str_replace('//INSERT LAZY CACHE LOAD HERE',
        $env === 'development' ? $lazyCache : $lazyCacheMin, $outputHtml);

    $outputHtml = str_replace(' PLEASE_REPLACE_WITH_MANIFEST', 
        $env === 'development' ? '' : ' manifest="/pager.manifest"', $outputHtml);


    $fp = fopen("../server/build/index.{$env}.html", 'w');
    fwrite($fp, $outputHtml);
    fclose($fp);
}



$static = 
    trim(
        shell_exec(
            'find ../public/js/build/ -name "*.js"'
        )
    )
    ."\n".
    trim(
        shell_exec(
            'find ../public/css -type f -name "*.woff"'
        )
    )
    ."\n".
    trim(
        shell_exec(
            'find ../public/css -type f -name "*.css"'
        )
    );
$time = time();
$static = str_replace('../public', '', $static);

$manifest = fopen("../public/pager.manifest", 'w');
fwrite($manifest, "CACHE MANIFEST
# BuildTime: ".date('Y-m-d H:i:s', $time)."

NETWORK:
*

CACHE:
/fav.ico
/js/inject.min.js
".$static);
fclose($manifest);