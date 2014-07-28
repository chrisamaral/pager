<?php
date_default_timezone_set('America/Sao_Paulo');
chdir(realpath(dirname(__FILE__)));

$time = time();

$build = file_get_contents('../input.build.json');
$build = str_replace('[moduleROOT]', "/js/v/{$time}", $build);

$l = '../server/build/lazy.cache.load.js';

$lazyCache = file_get_contents($l);
$lazyCacheMin = shell_exec("uglifyjs {$l}");

$inputHtml = file_get_contents('../server/build/index.html');
$build = json_decode($build, true);

//versioning
//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

    $build['production']['moduleRoot'] = "/js/v/{$time}";

    foreach ($build['production']['js'] as $key => $file) {
        $build['production']['js'][$key] = str_replace('/js/build/', "/js/v/{$time}/", $file);
    }

    $cssRoot = "/css/v/{$time}/";
    
    exec('rm -R ../public/css/build');
    exec('rm -R ../public/css/v');

    mkdir('../public/css-build');
    exec('cp -R ../public/css/* ../public/css-build');
    exec('mv ../public/css-build ../public/css/build');
    mkdir('../public/css/v');

    foreach ($build['development']['css'] as $key => $file) {
        
        $renamed = str_replace("/css/", $cssRoot, $file);
        $noRootFolder = str_replace("/css/", '', $file);

        $cmd = "lessc --clean-css ../public{$file} ../public/css/build/{$noRootFolder}";

        echo "$cmd\n"; exec($cmd);
        $build['production']['css'][$key] = $renamed;
    }

    //exec('rm ../public/js/v/*');
    //exec('rm ../public/css/v/*');

    chdir('../public/js/v');
    exec("ln -sT ../build {$time}");
    chdir('../../../scripts');

    chdir('../public/css/v');
    exec("ln -sT ../build {$time}");
    chdir('../../../scripts');

//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

foreach (array('development', 'production')  as $env) {
    $output = $build[$env];
    
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



$fp = fopen('../build.json', 'w');
fwrite($fp, json_encode($build, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
fclose($fp);

function replaceV ($str, $time) {
    return str_replace("/build/", "/v/{$time}/", $str);
}

$static = 
    trim(
        shell_exec(
            "find ../public/js/v/{$time}/ -name '*.js'"
        )
    )
    ."\n".
    trim(
        replaceV(
            shell_exec(
                "find ../public/css/build -type f -name '*.woff'"
            )
        , $time)
    )
    ."\n".
    trim(
        replaceV(
            shell_exec(
                "find ../public/css/build -type f -name '*.css'"
            )
        , $time)
    );

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