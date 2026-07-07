package com.phishguard

import java.net.URI
import java.net.URL
import kotlin.math.exp
import java.util.regex.Pattern

object PhishingEngine {

    data class Result(
        val url: String,
        val domain: String,
        val isSafe: Boolean,
        val score: Int,          // Safety score 0-100 (100 is completely safe)
        val rating: String,      // "SAFE", "SUSPICIOUS", "DANGEROUS"
        val warnings: List<String>
    )

    private data class UrlInfo(
        val hostname: String,
        val path: String,
        val protocol: String,
        val isValid: Int
    )

    private val TOP_BRANDS = listOf(
        "google.com", "facebook.com", "apple.com", "microsoft.com", 
        "amazon.com", "netflix.com", "paypal.com", "instagram.com", 
        "twitter.com", "yahoo.com", "linkedin.com", "zoom.us", 
        "chase.com", "bankofamerica.com", "wellsfargo.com", "citibank.com",
        "github.com", "gmail.com", "outlook.com", "coinbase.com", 
        "binance.com", "metamask.io"
    )

    private val SHORTENERS = listOf(
        "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", 
        "buff.ly", "adf.ly", "bit.do", "mcaf.ee", "su.pr", "rebrand.ly"
    )

    private val SUSPICIOUS_TLDS = listOf(
        "zip", "mov", "fit", "top", "tk", "ml", "ga", "cf", "gq", "work", 
        "click", "download", "racing", "stream", "win", "bid", "vip", "xyz",
        "ru", "cn", "su", "buzz", "date", "icu", "loan", "men", "xin"
    )

    private val SENSITIVE_WORDS = listOf(
        "confirm", "account", "banking", "secure", "login", "signin", 
        "verify", "webscr", "ebayisapi", "update", "password", "credential",
        "wallet", "auth", "recover", "claim", "free", "gift", "award"
    )

    // Levenshtein cache
    private val levenshteinCache = HashMap<String, Int>()

    private fun getLevenshteinDistance(a: String, b: String): Int {
        val key = "$a:$b"
        if (levenshteinCache.containsKey(key)) return levenshteinCache[key]!!
        val revKey = "$b:$a"
        if (levenshteinCache.containsKey(revKey)) return levenshteinCache[revKey]!!

        val dp = Array(a.length + 1) { IntArray(b.length + 1) }

        for (i in 0..a.length) {
            dp[i][0] = i
        }
        for (j in 0..b.length) {
            dp[0][j] = j
        }

        for (i in 1..a.length) {
            for (j in 1..b.length) {
                if (a[i - 1] == b[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1]
                } else {
                    dp[i][j] = minOf(
                        dp[i - 1][j - 1] + 1, // substitution
                        dp[i - 1][j] + 1,     // deletion
                        dp[i][j - 1] + 1      // insertion
                    )
                }
            }
        }
        val result = dp[a.length][b.length]
        levenshteinCache[key] = result
        return result
    }

    private fun calculateShannonEntropy(str: String): Double {
        val len = str.length
        if (len == 0) return 0.0
        val freqs = HashMap<Char, Int>()
        for (ch in str) {
            freqs[ch] = (freqs[ch] ?: 0) + 1
        }
        var entropy = 0.0
        for (count in freqs.values) {
            val p = count.toDouble() / len
            entropy -= p * (Math.log(p) / Math.log(2.0))
        }
        return entropy
    }

    private fun extractPrimaryDomainName(hostname: String): String {
        if (hostname.isEmpty()) return ""
        val domainParts = hostname.replace(Regex("^www\\."), "").split(".")
        if (domainParts.size < 2) return hostname

        val lastPart = domainParts.last()
        val secondLastPart = domainParts[domainParts.size - 2]

        val commonRegistryTlds = listOf("co", "com", "org", "net", "gov", "edu", "asn", "id", "ac")
        val isMultiPartSuffix = lastPart.length == 2 && commonRegistryTlds.contains(secondLastPart)

        return if (isMultiPartSuffix && domainParts.size >= 3) {
            domainParts[domainParts.size - 3]
        } else {
            domainParts[domainParts.size - 2]
        }
    }

    private fun countOccurrences(str: String, word: String): Int {
        var count = 0
        var pos = str.indexOf(word)
        while (pos != -1) {
            count++
            pos = str.indexOf(word, pos + 1)
        }
        return count
    }

    fun verifyUrl(urlString: String): Result {
        val rawUrl = urlString.trim()
        if (rawUrl.isEmpty()) {
            return Result(rawUrl, "", true, 100, "SAFE", listOf("Empty URL"))
        }

        var isHttps = 0
        val parsedResult = try {
            var urlToParse = rawUrl
            if (!urlToParse.startsWith("http://", ignoreCase = true) && 
                !urlToParse.startsWith("https://", ignoreCase = true)) {
                urlToParse = "https://$urlToParse"
            }
            val parsedUrl = URI(urlToParse)
            val h = parsedUrl.host?.lowercase() ?: ""
            val p = parsedUrl.path ?: ""
            val pr = parsedUrl.scheme?.lowercase() ?: ""
            if (pr == "https") isHttps = 1
            UrlInfo(h, p, pr, 1)
        } catch (e: Exception) {
            val parts = rawUrl.split("/")
            val h = parts.firstOrNull()?.lowercase() ?: ""
            val p = if (parts.size > 1) rawUrl.substring(h.length) else ""
            UrlInfo(h, p, "", 0)
        }

        val hostname = parsedResult.hostname
        val path = parsedResult.path
        val isValid = parsedResult.isValid

        // Whitelist quick check
        val isWhitelisted = TOP_BRANDS.any { brand ->
            hostname == brand || hostname.endsWith(".$brand")
        }

        if (isWhitelisted && isHttps == 1) {
            return Result(
                url = rawUrl,
                domain = hostname,
                isSafe = true,
                score = 100,
                rating = "SAFE",
                warnings = emptyList()
            )
        }

        // Model feature extraction
        val urlLength = rawUrl.length
        val domainLength = hostname.length
        
        val ipPattern = Pattern.compile("^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$")
        val isIp = if (ipPattern.matcher(hostname).matches()) 1.0 else 0.0
        
        var tldLength = 0.0
        var subdomainCount = 0.0
        if (hostname.isNotEmpty() && isIp == 0.0) {
            val parts = hostname.split(".")
            if (parts.size >= 2) {
                tldLength = parts.last().length.toDouble()
                subdomainCount = maxOf(0, parts.size - 2).toDouble()
            }
        }
        
        val isHttpsVal = if (isHttps == 1) 1.0 else 0.0
        
        var letters = 0
        var digits = 0
        for (ch in rawUrl) {
            if (ch.isLetter()) {
                letters++
            } else if (ch.isDigit()) {
                digits++
            }
        }
        val special = rawUrl.length - letters - digits
        
        val urlLengthDouble = urlLength.toDouble()
        val letterRatio = if (urlLengthDouble > 0.0) letters.toDouble() / urlLengthDouble else 0.0
        val digitRatio = if (urlLengthDouble > 0.0) digits.toDouble() / urlLengthDouble else 0.0
        val specialRatio = if (urlLengthDouble > 0.0) special.toDouble() / urlLengthDouble else 0.0
        
        val equalsCount = countOccurrences(rawUrl, "=").toDouble()
        val qmarkCount = countOccurrences(rawUrl, "?").toDouble()
        val ampCount = countOccurrences(rawUrl, "&").toDouble()
        val hyphenCount = countOccurrences(rawUrl, "-").toDouble()
        val dotsCount = countOccurrences(rawUrl, ".").toDouble()
        val slashCount = countOccurrences(rawUrl, "/").toDouble()

        // Heuristics Checks & Feature Preparation
        val isIpAddress = isIp == 1.0

        val primaryName = if (!isIpAddress && hostname.isNotEmpty()) extractPrimaryDomainName(hostname) else ""

        val shannonEntropyVal = if (hostname.isNotEmpty() && !isIpAddress) {
            calculateShannonEntropy(primaryName)
        } else {
            0.0
        }

        var sensitiveWordsCount = 0
        val lowerUrl = rawUrl.lowercase()
        for (word in SENSITIVE_WORDS) {
            sensitiveWordsCount += countOccurrences(lowerUrl, word)
        }
        val sensitiveWordsCountVal = sensitiveWordsCount.toDouble()

        val isShort = SHORTENERS.any { sh -> hostname == sh || hostname.endsWith(".$sh") }
        val isShortVal = if (isShort) 1.0 else 0.0

        val isSuspiciousTldVal = if (hostname.isNotEmpty() && !isIpAddress && SUSPICIOUS_TLDS.contains(hostname.split(".").last())) 1.0 else 0.0

        var typosquatTarget: String? = null
        var brandAbuse = false
        if (!isIpAddress && hostname.isNotEmpty()) {
            val hostParts = hostname.replace(Regex("^www\\."), "").split(".")

            // Contains Brand Name?
            for (brand in TOP_BRANDS) {
                val brandRaw = brand.split(".").first()
                if (hostname.contains(brandRaw) && !hostname.endsWith(".$brand") && hostname != brand) {
                    brandAbuse = true
                    typosquatTarget = brand
                    break
                }
            }

            // Closely resembles brand (Levenshtein check)?
            if (!brandAbuse) {
                var minDistance = 999
                for (brand in TOP_BRANDS) {
                    val brandRaw = brand.split(".").first()
                    if (primaryName != brandRaw) {
                        val dist = getLevenshteinDistance(primaryName, brandRaw)
                        if (dist in 1..2 && dist < minDistance) {
                            minDistance = dist
                            typosquatTarget = brand
                        }
                    }
                }
            }
        }
        val isTyposquattingVal = if (typosquatTarget != null && !brandAbuse) 1.0 else 0.0
        val brandAbuseTriggeredVal = if (brandAbuse) 1.0 else 0.0

        // ML normalization parameters (from phishing_model_weights.json)
        val means = mapOf(
            "url_length" to 62.9131,
            "domain_length" to 20.59727,
            "is_ip" to 0.005215,
            "tld_length" to 2.821825,
            "subdomain_count" to 0.75099,
            "is_https" to 0.45755,
            "letters" to 46.433865,
            "letter_ratio" to 0.768918,
            "digits" to 7.675435,
            "digit_ratio" to 0.073599,
            "special" to 8.8038,
            "special_ratio" to 0.157483,
            "equals_count" to 0.32629,
            "qmark_count" to 0.156645,
            "amp_count" to 0.14923,
            "hyphen_count" to 1.28197,
            "dots_count" to 2.273705,
            "slash_count" to 3.209805,
            "shannon_entropy" to 2.702479,
            "sensitive_words_count" to 0.22294,
            "is_shortened" to 0.00077,
            "is_suspicious_tld" to 0.05509,
            "is_typosquatting" to 0.00252,
            "brand_abuse_triggered" to 0.034175
        )

        val stds = mapOf(
            "url_length" to 82.389127,
            "domain_length" to 11.884164,
            "is_ip" to 0.072026,
            "tld_length" to 0.620176,
            "subdomain_count" to 0.991607,
            "is_https" to 0.498195,
            "letters" to 57.136987,
            "letter_ratio" to 0.102872,
            "digits" to 22.630328,
            "digit_ratio" to 0.104009,
            "special" to 10.510766,
            "special_ratio" to 0.046895,
            "equals_count" to 1.289575,
            "qmark_count" to 0.416818,
            "amp_count" to 0.846038,
            "hyphen_count" to 2.661164,
            "dots_count" to 3.492884,
            "slash_count" to 2.997498,
            "shannon_entropy" to 0.626925,
            "sensitive_words_count" to 1.994356,
            "is_shortened" to 0.027738,
            "is_suspicious_tld" to 0.228156,
            "is_typosquatting" to 0.050136,
            "brand_abuse_triggered" to 0.181678
        )

        val weights = mapOf(
            "url_length" to 0.197894,
            "domain_length" to 1.470395,
            "is_ip" to 0.287978,
            "tld_length" to 0.006417,
            "subdomain_count" to -0.762411,
            "is_https" to 0.791169,
            "letters" to 0.444857,
            "letter_ratio" to -0.215907,
            "digits" to 0.025833,
            "digit_ratio" to 0.102017,
            "special" to -0.922685,
            "special_ratio" to 0.247363,
            "equals_count" to 0.332909,
            "qmark_count" to -0.216133,
            "amp_count" to -0.096964,
            "hyphen_count" to -0.552863,
            "dots_count" to 0.257791,
            "slash_count" to 1.491433,
            "shannon_entropy" to -0.323807,
            "sensitive_words_count" to 0.129927,
            "is_shortened" to 0.036899,
            "is_suspicious_tld" to 0.627049,
            "is_typosquatting" to 0.008297,
            "brand_abuse_triggered" to 0.127117
        )
        val bias = 0.164736

        // Predict Z-score
        var z = bias
        val features = mapOf(
            "url_length" to urlLength.toDouble(), "domain_length" to domainLength.toDouble(), "is_ip" to isIp,
            "tld_length" to tldLength, "subdomain_count" to subdomainCount, "is_https" to isHttpsVal,
            "letters" to letters.toDouble(), "letter_ratio" to letterRatio, "digits" to digits.toDouble(),
            "digit_ratio" to digitRatio, "special" to special.toDouble(), "special_ratio" to specialRatio,
            "equals_count" to equalsCount, "qmark_count" to qmarkCount, "amp_count" to ampCount,
            "hyphen_count" to hyphenCount, "dots_count" to dotsCount, "slash_count" to slashCount,
            "shannon_entropy" to shannonEntropyVal,
            "sensitive_words_count" to sensitiveWordsCountVal,
            "is_shortened" to isShortVal,
            "is_suspicious_tld" to isSuspiciousTldVal,
            "is_typosquatting" to isTyposquattingVal,
            "brand_abuse_triggered" to brandAbuseTriggeredVal
        )

        for ((feat, value) in features) {
            val mean = means[feat] ?: 0.0
            val std = stds[feat] ?: 1.0
            val weight = weights[feat] ?: 0.0
            val normalized = (value - mean) / std
            z += normalized * weight
        }

        // Logistic Regression Probability
        val mlProbability = 1.0 / (1.0 + exp(-z))
        val mlScore = (mlProbability * 100).toInt()

        // Heuristics Checks
        val warnings = ArrayList<String>()
        var riskScore = 0

        // Heuristics 1: Connection Security
        if (isHttps == 0) {
            warnings.add("• Insecure Connection: The link uses unencrypted HTTP protocol.")
            riskScore += 20
        }

        // Heuristics 2: IP Address in Hostname
        if (isIpAddress) {
            warnings.add("• IP Domain: Uses raw numerical IP address instead of domain name.")
            riskScore += 35
        }

        // Heuristics 3: URL Shortener
        if (isShortVal == 1.0) {
            warnings.add("• Masked Link: Uses a link shortener to hide destination website.")
            riskScore += 20
        }

        // Heuristics 4: Typosquatting & Brand Spoofing
        if (typosquatTarget != null) {
            if (brandAbuse) {
                warnings.add("• Brand Spoofing: Contains official trademark '${typosquatTarget.split('.').first()}' but is hosted on an unofficial server.")
            } else {
                warnings.add("• Typosquatting: Domain mimics verified brand '$typosquatTarget' using typos.")
            }
            riskScore += 50
        }

        // Heuristics 5: Sensitive Words Abuse
        if (sensitiveWordsCount > 0) {
            warnings.add("• Deceptive Keywords: URL paths use security/urgency words to trick you.")
            riskScore += 15
        }

        // Heuristics 6: Entropy (Random auto-generated names)
        if (primaryName.length > 8 && shannonEntropyVal > 4.1) {
            warnings.add("• Random Generated Domain: Characters in domain look scripted/random.")
            riskScore += 15
        }

        // Heuristics 7: Dots count (Excess subdomains)
        if (dotsCount > 4.0) {
            warnings.add("• Excessive Subdomains: Domain stacks nested parts to mask target.")
            riskScore += 15
        }

        // Heuristics 8: @ Symbol
        if (rawUrl.contains("@")) {
            warnings.add("• Deceptive Credentials: URL uses '@' to force browser redirection.")
            riskScore += 30
        }

        // Heuristics 9: IDN Homograph / Cyrillic characters
        val isPuny = hostname.split(".").any { it.startsWith("xn--") }
        if (isPuny) {
            warnings.add("• IDN Homograph Attack: Obfuscates text using Cyrillic/non-English script mappings.")
            riskScore += 60
        }

        // Heuristics 10: Suspicious TLD
        if (isSuspiciousTldVal == 1.0) {
            val tld = hostname.split(".").last()
            warnings.add("• High-Risk Domain TLD: The extension '.$tld' is statistically associated with malware and spam.")
            riskScore += 20
        }

        // Final score calculation
        var finalRiskScore = if (warnings.isNotEmpty()) {
            maxOf(riskScore, mlScore)
        } else {
            minOf(mlScore, 20) // cap at 20 (Safe) if no warnings triggered
        }

        finalRiskScore = minOf(maxOf(finalRiskScore, 0), 100)
        val safetyScore = 100 - finalRiskScore

        val rating = when {
            finalRiskScore >= 70 -> "DANGEROUS"
            finalRiskScore >= 35 -> "SUSPICIOUS"
            else -> "SAFE"
        }

        return Result(
            url = rawUrl,
            domain = hostname,
            isSafe = rating == "SAFE",
            score = safetyScore,
            rating = rating,
            warnings = warnings
        )
    }
}
