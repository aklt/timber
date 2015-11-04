# Timber - Simple Templating

Timber is a super simple template engine.  It makes template functions from
files, possibly containing keywords and interpolations.

Keywords are prefixed with a semicolon.  The built in keywords are:

    :for or :loop      Loop over an array
    :each or :forin    Loop over an object
    :if :else :elsif   Conditionals

Value interpolation is defined with these methods

    {h <target>}   HTML escape the value
    {t <target>}   String escape
    {e <target>}   Evaluate a js expresion
    {( <target>)}  Also evaluates (diferent syntax?)

An example document:
    
    {h Title}
    :loop
      repeat {h value} 
    :if footer
      ---- Thje End ----

Will produce this function:



The commandline timber command can be used as follows:
    
    timber <dir|file|"builtin"> [context] [template] [data]

List the default builtins the template depends on

    timber builtin

Create templates from a file or dir

    timber myTemplates/

The exact string builtin cannot be used as a directory name

Export template functions on module.exports:

    timber myTemplates module.exports

List a specific function




