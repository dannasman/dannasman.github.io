---
layout: post
title:  "Rusty compiler: Writing a lexer in Rust"
date:   2022-08-26 20:40:46 +0300
categories: jekyll update
---
In this post we will be implementing a lexer in Rust. Lexer is a tool used in Compiler design to read characters from the input and group then into tokens. These tokens are then passed on forward to a parser, which will be the topic of the second part of this series.

Our lexer will be grouping the characters into 15 different tokens. Let us enumerate these tokens in `lexer.rs`:

{% highlight rust %}
#[derive(Debug, Clone)]
pub enum Token    {
    Num(f64),
    Id(String),
    True(String),
    False(String),
    If(String),
    Else(String),
    While(String),
    And(String),
    Or(String),
    Eql(String),
    Ne(String),
    Le(String),
    Ge(String),
    Lt(String),
    Gt(String),
}
{% endhighlight %}
`Num` corresponds to a number and has a type `f64`. In our implementation all digits are identified as 64-bit floating point numbers

`True` and `False` correspond to boolean values `true` and `false`. They are given `String` type values `"true"` and `"false"` respectively.

`If`, `Else` and `While` correspond to control flow operators. They are given `String` type values `"if"`, `"else"` and `"while"` respectively.

`And` and `Or` correspond to logical operators. They are given `String` type values `"&&"`, `"||"` respectively.

`Eql`, `Ne`, `Le`, `Ge`, `Lt` and `Gt` correspond to relational operators. They are given `String` type values `"=="`, `"!="` `"<="`, `">="`, `"<"` and `">"` respectively.

`Id` corresponds to a combination of characters beginning with a alphabetic character that did not classify as any other token above. 

Now that we have our `Token` enum we can move on to implement the actual `lex` function that does all the heavy lifting. The function recieves a reference to the input as a parameter and returns a vector of Tokens if there are no errors. In `lexer.rs` we first write:
{% highlight rust %}
pub fn lex(input: &String) -> Result<Vec<Token>, String>    {
    let mut result = Vec::new();

    let mut words = HashMap::from([
        ("true".to_string(),  Token::True("true".to_string())),
        ("false".to_string(), Token::False("false".to_string())),
        ("if".to_string(),    Token::If("if".to_string())),
        ("else".to_string(),  Token::Else("else".to_string())),
        ("while".to_string(), Token::While("while".to_string())),
    ]);

    let mut it = input.chars().peekable();

    let mut _lineno = 1;

    return Ok(result);
}
{% endhighlight %}
In the snippet above we create a vector of type `Vec<Token>` for the Tokens to be saved in. We also create an hashmap for words that already have been assigned a token. To process the input we create an peekable iterator `it`. To help debugging we also keep track of the line number with variable `_lineno`.

Now to analyzing the input. Using a `while` loop, `match` expression and the iterator `it` we can read the input character by character. Let us first make the `lex` function ignore spaces `' '` and tabs `'\t'` and increase the line number when it comes across newline `\n`. In `lexer.rs`:
{% highlight rust %}
    //...

    while let Some(&c) = it.peek()  {
        match c {
            ' ' | '\t' => {
                it.next();
            },
            '\n'  =>  {
                _lineno += 1;
                it.next();
            },
        }
    }

    return Ok(result);
}
{% endhighlight %}

Next up are the logical operators. If a character matches with `"&"`, we iterate onto the next character. If the next character also matches with `"&"` we save a `And` token with value `"&&"` to the `result` vector. If the next character does not match to `"&"` we save the previous character (`"&"`) as a `Id` token and keep the next character for the next iteration of the `while` loop. Same applies to `Or` token. In `lexer.rs`:
{% highlight rust %}
        //...
        match c {
            //...
            '&' =>  {
                it.next();
                let ch = it.peek();
                if let Some('&') = ch   {
                    result.push(Token::And("&&".to_string()));
                    it.next();
                } else  {
                    result.push(Token::Id("&".to_string()));
                };
            },
            '|' =>  {
                it.next();
                let ch = it.peek();
                if let Some('|') = ch   {
                    result.push(Token::Or("||".to_string()));
                    it.next();
                } else  {
                    result.push(Token::Id("|".to_string()));
                };
            },
        }
    }

    return Ok(result);
}
{% endhighlight %}

The relational operators are quite similar to the logical operators when it comes to our lexer. First we match the first character and if the second character also matches the token's second character, token is saved with value corresponding to it. Otherwise the first character is saved as `Id` token and we move on keeping track of the second character. In `lexer.rs`:
{% highlight rust %}
        //...
        match c {
            //...
            '=' =>  {
                it.next();
                let ch = it.peek();
                if let Some('=') = ch   {
                    result.push(Token::Eql("==".to_string()));
                    it.next();
                } else  {
                    result.push(Token::Id("=".to_string()));
                };
            },
            '!' =>  {
                it.next();
                let ch = it.peek();
                if let Some('=') = ch   {
                    result.push(Token::Ne("!=".to_string()));
                    it.next();
                } else  {
                    result.push(Token::Id("!".to_string()));
                };
            },
            '<' =>  {
                it.next();
                let ch = it.peek();
                if let Some('=') = ch   {
                    result.push(Token::Le("<=".to_string()));
                    it.next();
                } else  {
                    result.push(Token::Lt("<".to_string()));
                };
            },
            '>' =>  {
                it.next();
                let ch = it.peek();
                if let Some('=') = ch   {
                    result.push(Token::Ge(">=".to_string()));
                    it.next();
                } else  {
                    result.push(Token::Gt(">".to_string()));
                };
            },
        }
    }

    return Ok(result);
}
{% endhighlight %}

Things get a bit more complicated when it comes to numbers. If the character matches to any digit between 0 and 9 it isturned to a floating point digit and saved as `Num` token.  Whether the number has decimals or not is checked by inspecting if the next character is a `"."` followed by more digits. In `lexer.rs`:
{% highlight rust %}
        //...
        match c {
            //...
            '0'..='9' =>    {
                let mut n = c.to_string().parse::<f64>().expect("Character not a digit.");

                it.next();
                let mut digitch = it.peek();

                while let Some(&i) = digitch {
                    if !i.is_digit(10)   {
                        if i == '.'    {
                            let mut d = 10.0;
                            it.next();
                            digitch = it.peek();

                            while let Some(&j) = digitch    {
                                if !j.is_digit(10) {
                                    digitch = None;
                                } else  {
                                    let f = j.to_string().parse::<f64>().expect("Character not a digit.");
                                    n = n + f / d;
                                    d = d * 10.0;
                                    it.next();
                                    digitch = it.peek();
                                }
                            }
                        } else  {
                            digitch = None;
                        }
                    } else  {
                        let digit = i.to_string().parse::<f64>().expect("Character not a digit.");
                        n = n*10.0 + digit;
                        it.next();
                        digitch = it.peek();
                    }
                }
                result.push(Token::Num(n));
            }
        }
    }

    return Ok(result);
}
{% endhighlight %}
Next up we have words. If the character is alphabetical, we move the iterator forward and all group the characters a word until the iterator points to a character that is not alphabetical or a digit. We then look whether a token with the word as its value already exists in the `words` hashmap. If it does not, we insert token `Id` with the word as its value onto the hashmap and push the token to the `result` vector. Otherwise we save the token returned from `words` to the `results` vector. In `lexer.rs`:
{% highlight rust %}
        //...
        match c {
            //...
            'A'..='Z' | 'a'..='z' => {
                let mut s = String::new();
                s.push(c);

                it.next();
                let mut ch = it.peek();
                while let Some(&i) = ch {
                    if !i.is_digit(10) && !i.is_alphabetic()  {
                        ch = None;
                    } else  {
                        s.push(i);
                        it.next();
                        ch = it.peek();
                    }
                }
                println!("{}", s);
                match words.get(&s)  {
                    Some(t) => result.push(Token::clone(t)),
                    None => {
                        result.push(Token::Id(s.clone()));
                        words.insert(s.clone(), Token::Id(s.clone()));
                    },
                }
            },
        }
    }

    return Ok(result);
}
{% endhighlight %}

Lastly we have the characters that have didn't match with any of the conditions above. In these cases a `Id` token with the character as its value is saved to the `results` vector. In `lexer.rs`:
{% highlight rust %}
        //...
        match c {
            //...
            _ => {
                result.push(Token::Id(c.to_string()));
                it.next();
            },
        }
    }

    return Ok(result);
}
{% endhighlight %}

We finalize the code by writing couple of tests. In `lexer.rs`:
{% highlight rust %}
//...
#[cfg(test)]
mod tests    {
    use super::*;

    #[test]
    fn correct_amount_of_tokens()   {
        let input = String::from("1 _ != && =ok 3.4 1.0=_");
        let result = lex(&input);
        match result    {
            Ok(r) => assert_eq!(10, r.len()),
            Err(_) => println!("Error getting the return value."),
        }
    }

    #[test]
    fn correct_token_types()    {
        let input = String::from("1 _ while != && =ok 3.4 1.0=_ true false if else true1");
        let result = lex(&input);
        match result    {
            Ok(r) =>    {
                let output = format!("{:?}", r);
                assert_eq!(r#"[Num(1.0), Id("_"), While("while"), Ne("!="), And("&&"), Id("="), Id("ok"), Num(3.4), Num(1.0), Id("="), Id("_"), True("true"), False("false"), If("if"), Else("else"), Id("true1")]"#, output)
            },
            Err(_) => println!("Error getting the return value."),
        }
    }
}
{% endhighlight %}

We now have a working lexer. Next step is to implement a parser that analyses the tokens returned by the lexer. Stay tuned.
