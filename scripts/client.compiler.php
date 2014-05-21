<?php
$path = realpath(dirname(__FILE__).'/..');
chdir($path);
exec("rm -R public/js/build/*");
function compile_js($path){
    $output = str_replace('/src', '/build', $path);
    $file = pathinfo($output);
    if(!file_exists($file['dirname'])){
    mkdir($file['dirname'], 0777, true);
    }
    $cmd = "closure --js={$path} --js_output_file={$output}";
    echo "$cmd\n";
    system($cmd);
}

$jsFiles = explode("\n", trim(shell_exec('find public/js/src/ -type f -not -path "*/.module-cache/*" -name "*.js"')));
foreach($jsFiles as $path){
    compile_js($path);
}